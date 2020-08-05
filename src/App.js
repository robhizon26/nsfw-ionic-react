import React, { useState, useEffect, Component } from "react";
import { IonModal, IonButton, IonContent, IonBackdrop , IonLoading} from "@ionic/react";
import logo from "./logo.svg";
import "./App.css";
import * as nsfwjs from "nsfwjs";
import Dropzone from "react-dropzone";
// import Webcam from "react-webcam";
import {
  Plugins,
  Capacitor,
  CameraSource,
  CameraResultType,
} from "@capacitor/core";
// components
import Underdrop from "./components/Underdrop";
import Loading from "./components/Loading";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Results from "./components/Results";
import CropEditModal from "./components/CropEditModal";
import './theme/variables.css';

const blurred = { filter: "blur(30px)", WebkitFilter: "blur(30px)" };
const clean = {};
const loadingMessage = "Loading NSFWJS Model";
const dragMessage = "Drag and drop an image to check";
const camMessage = "Cam active";
const DETECTION_PERIOD = 1000;

const availableModels = {
  mobilenetv2: ["/quant_nsfw_mobilenet/"],
  mobilenetMid: ["/quant_mid/", { type: "graph" }],
  inceptionv3: ["/model/", { size: 299 }],
};

class App extends Component {
  constructor() {
    super();
    this.dropZone = React.createRef();
    this.inputRef = React.createRef();
  }
  selectedCamImage = '';
  state = {
    model: null,
    graphic: logo,
    titleMessage: "Please hold, the model is loading...",
    message: loadingMessage,
    predictions: [],
    droppedImageStyle: { opacity: 0.4 },
    blurNSFW: true,
    enableWebcam: false,
    loading: true,
    fileType: null,
    hardReset: false,
    gifControl: null,
    currentModelName: "mobilenetMid",
    showModal: false,
    isLoadingImage:false
  };

  componentDidMount() {
    this._loadModel(this.state.currentModelName);
  }

  _onChange = ({ value }) => {
    this._loadModel(value);
  };

  _loadModel = (value) => {
    this.setState({
      titleMessage: "Please hold, the model is loading...",
      message: loadingMessage,
      droppedImageStyle: { opacity: 0.4 },
      graphic: logo,
      hardReset: true,
      predictions: [],
      loading: true,
    });
    // Load model from public folder
    nsfwjs
      .load(...availableModels[value])
      .then((model) => {
        this.setState({
          model,
          titleMessage: this.state.enableWebcam ? camMessage : dragMessage,
          message: "Ready to Classify",
          loading: false,
          currentModelName: value,
        });
      })
      .catch((err) => {
        this.setState({
          message: "Error on model change. Ready to Classify on previous model",
          loading: false,
        });
      });
  };

  _refWeb = (webcam) => {
    this.webcam = webcam;
  };

  // terrible race condition fix :'(
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  detectBlurStatus = (predictions, blurNSFW = this.state.blurNSFW) => {
    let droppedImageStyle = clean;
    if (this.state.fileType === "image/gif") {
      const deemedEvil = this.detectGifEvil(predictions);
      droppedImageStyle = deemedEvil > 0 && blurNSFW ? blurred : clean;
    } else {
      if (blurNSFW) {
        switch (predictions[0].className) {
          case "Hentai":
          case "Porn":
          case "Sexy":
            droppedImageStyle = blurred;
        }
      }
    }
    return droppedImageStyle;
  };

  detectGifEvil = (predictions) =>
    predictions
      .filter((c) => {
        return ["Hentai", "Porn", "Sexy"].includes(c[0].className);
      })
      .flat().length;

  checkContent = async () => {
    // Sleep bc it's grabbing image before it's rendered
    // Not really a problem of this library
    await this.sleep(100);
    const img = this.refs.dropped;
    if (this.state.fileType === "image/gif") {
      this.setState({
        message: `0% - Parsing GIF frames`,
        predictions: [],
        loading: true,
      });
      const predictions = await this.state.model.classifyGif(img, {
        topk: 1,
        setGifControl: (gifControl) => {
          this.setState({
            gifControl,
          });
        },
        onFrame: ({ index, totalFrames, predictions }) => {
          const percent = ((index / totalFrames) * 100).toFixed(0);
          this.setState({
            message: `${percent}% - Frame ${index} is ${predictions[0].className}`,
          });
        },
      });
      const deemedEvil = this.detectGifEvil(predictions);
      // If any frame is NSFW, blur it (if blur is on)
      const droppedImageStyle = this.detectBlurStatus(predictions);
      const gifMessage =
        deemedEvil > 0
          ? `Detected ${deemedEvil} NSFW frames`
          : "All frames look clean";
      this.setState({
        message: `GIF Result: ${gifMessage}`,
        predictions,
        droppedImageStyle,
        loading: false,
      });
    } else {
      const predictions = await this.state.model.classify(img);
      let droppedImageStyle = this.detectBlurStatus(predictions);
      this.setState({
        message: `Identified as ${predictions[0].className}`,
        predictions,
        droppedImageStyle,
      });
    }
  };

  setFile = (file) => {
    // drag and dropped
    const reader = new FileReader();
    reader.onload = (e) => {
      this.setState(
        { graphic: e.target.result, fileType: file.type },
        this.checkContent
      );
    };

    reader.readAsDataURL(file);
  };

  onDrop = (accepted, rejected) => {
    if (rejected && rejected.length > 0) {
      window.alert("JPG, PNG, GIF only plz");
    } else {
      this.onDropDetail(accepted[0]);
    }
  };

  onPickCamImage = async() => {
    if (!Capacitor.isPluginAvailable("Camera")) {
      this.inputRef.current.click();
      return;
    }
    const info = await Plugins.Device.getInfo()
    if (info.platform == 'web') {
      this.inputRef.current.click();
      return;
    }
    this.setState({ isLoadingImage:true});
    Plugins.Camera.getPhoto({
      quality: 50,
      source: CameraSource.Camera,
      // correctOrientation: true,
      // height: 320,
      // width: 200,
      resultType: CameraResultType.Base64
    })
      .then((image) => {
        const selectedCamImage = "data:image/jpeg;base64," + image.base64String;
        this.selectedCamImage = selectedCamImage;
        this.setState({ showModal: true ,isLoadingImage:false});
      })
      .catch((error) => {
        this.inputRef.current.click();
        return false;
      });
  };

  onFileChosen = (event) => {
    const pickedFile = event.target.files[0];
    if (!pickedFile) {
      return;
    }
    const fr = new FileReader();
    fr.onloadend = () => {
      const dataUrl = fr.result?.toString();
      this.selectedCamImage = dataUrl;
      this.setState({ showModal: true });
    };
    fr.readAsDataURL(pickedFile);
  }

  onDropDetail(selectedImage) {
    let droppedImageStyle = this.state.blurNSFW ? blurred : clean;
    this.setState({
      message: "Processing...",
      droppedImageStyle,
      hardReset: true,
    });
    this.setFile(selectedImage);
  }

  detectWebcam = async () => {
    await this.sleep(100);

    const video = document.querySelectorAll(".captureCam");
    // assure video is still shown
    if (video[0]) {
      const predictions = await this.state.model.classify(video[0]);
      let droppedImageStyle = this.detectBlurStatus(predictions);
      this.setState({
        message: `Identified as ${predictions[0].className}`,
        predictions,
        graphic: logo,
        droppedImageStyle,
      });
      setTimeout(this.detectWebcam, DETECTION_PERIOD);
    }
  };

  blurChange = (checked) => {
    // Check on blurring
    let droppedImageStyle = clean;
    if (this.state.predictions.length > 0) {
      droppedImageStyle = this.detectBlurStatus(
        this.state.predictions,
        checked
      );
    }

    this.setState({
      blurNSFW: checked,
      droppedImageStyle,
    });
  };

  _renderInterface = () => {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    const videoConstraints = {
      width: { ideal: maxWidth, max: maxWidth },
      height: { ideal: maxHeight, max: maxHeight },
      facingMode: "environment",
    };
    // SuperGif kills our React Component
    // Only way I can seem to revive it is
    // to force a full re-render of Drop area
    if (this.state.hardReset) {
      this.setState({ hardReset: false });
      return null;
    }
    const imgEl = (
      <img
        src={this.state.graphic}
        alt="drop your file here"
        className="dropped-photo"
        ref="dropped"
      />
    );

    return (
      <>
        {this.state.enableWebcam &&
          <>
            <div className="photo-box" onClick={this.onPickCamImage}>
              {imgEl}
            </div>
            <input type="file" accept="image/jpeg" ref={this.inputRef} onChange={this.onFileChosen}   />
          </>
        }
        {!this.state.enableWebcam && (
          <Dropzone
            id="dropBox"
            accept="image/jpeg, image/png, image/gif"
            className="photo-box"
            onDrop={this.onDrop.bind(this)}
            ref={this.dropZone}
          >
            {imgEl}
          </Dropzone>
        )}
      </>
    );
  };

  _camChange = (e) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      window.alert(
        "Sorry, your browser doesn't seem to support camera access."
      );
      return;
    }
    this.detectWebcam();
    this.setState({
      enableWebcam: !this.state.enableWebcam,
      message: "Ready",
      predictions: [],
      droppedImageStyle: {},
      fileType: null,
      titleMessage: this.state.enableWebcam ? dragMessage : camMessage,
    });
  };
  _setShowModal = (showModal) => {
    this.setState({ showModal });
  };
  _setImage = (image) => {
   const newImage = image||  this.selectedCamImage;
    this.setState(
      { graphic: newImage, fileType: "image/jpeg, showModal:false", showModal: false },
      this.checkContent
    );
  };
  render() {
    return (
      <>
        <CropEditModal
          showModal={this.state.showModal}
          image={this.selectedCamImage}
          setShowModal={this._setShowModal}
          setImageOnParent={this._setImage}
        />
        <IonLoading
          isOpen={this.isLoadingImage}
          onDidDismiss={() => this.setState( {isLoadingImage:false})}
          message={'Loading image to crop...'}
        />
        {!this.state.showModal && 
        <div className="App">
          <Header />
          <main>
            <div>
              <div id="overDrop">
                <p id="topMessage">{this.state.titleMessage}</p>
              </div>
              {this._renderInterface()}
              <Underdrop
                camChange={this._camChange}
                camStatus={this.state.enableWebcam}
                blurChange={this.blurChange}
                blurStatus={this.state.blurNSFW}
              />
            </div>
            <Loading showLoading={this.state.loading} />
            <Results
              message={this.state.message}
              gifControl={this.state.gifControl}
              predictions={this.state.predictions}
            />
          </main>
          <Footer
            onChange={this._onChange}
            value={this.state.currentModelName}
          />
        </div>}
      </>
    );
  }
}

export default App;
