import React, { useState, useEffect, Component } from "react";
import {
  IonModal,
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButtons,
} from "@ionic/react";
import { arrowBackOutline, checkmark } from "ionicons/icons";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

let imageRef = null;
const CropEditModal = (props) => {
  const [src, setSrc] = useState(props.image);
  const [croppedImageUrl, setCroppedImageUrl] = useState(props.image);
  const [crop, setCrop] = useState({
    unit: "%",
    aspect: 1,
    width: 100
  });
  // If you setState the crop in here you should return false.
  const onImageLoaded = (image) => {
    imageRef = image;
    return false;
  };

  const onCropComplete = (crop) => {
    makeClientCrop(crop);
  };

  const onCropChange = (crop, percentCrop) => {
    setCrop(crop);
  };
  const makeClientCrop = async (crop) => {
    // console.log("imageRef", imageRef);
    if (imageRef && crop.width && crop.height) {
      const croppedImageUrl = await getCroppedImg(
        imageRef,
        crop,
        "newFile.jpeg"
      );
      // console.log('makeClientCrop',croppedImageUrl)
      setCroppedImageUrl(croppedImageUrl);
    }
  };
  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    // As Base64 string
    const base64Image = canvas.toDataURL("image/jpeg");
    return base64Image;

    // return new Promise((resolve, reject) => {
    //   canvas.toBlob(
    //     (blob) => {
    //       if (!blob) {
    //         //reject(new Error('Canvas is empty'));
    //         reject("Canvas is empty");
    //         return;
    //       }
    //       blob.name = fileName;
    //       const fileUrl = window.URL.createObjectURL(blob);
    //       blob.url = fileUrl;
    //       resolve(blob);
    //     },
    //     "image/jpeg",
    //     1
    //   );
    // });
  };

  const setImageOnParent = () => {
    // console.log("setImageOnParent croppedImageUrl", croppedImageUrl);
    props.setImageOnParent(croppedImageUrl);
  };
  return (
    <>
      <IonContent>
        <IonModal isOpen={props.showModal} cssClass="my-custom-class">
          <IonHeader>
            <IonToolbar color="primary" class="ion-toolbar">
              <IonButtons slot="start">
                {/* <IonButton onClick={() => props.setShowModal(falssetShowModale)}> */}
                <IonButton onClick={props.setShowModal.bind(this, false)}>
                  <IonIcon slot="icon-only" icon={arrowBackOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Pinch to Crop Image</IonTitle>
              <IonButtons slot="primary">
                <IonButton onClick={setImageOnParent}>
                  <IonIcon slot="icon-only" icon={checkmark} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          {props.image && (
            <ReactCrop
              src={props.image}
              crop={crop}
              onImageLoaded={onImageLoaded}
              onComplete={onCropComplete}
              onChange={onCropChange}
            />
          )}
          {/* <img src={props.image} alt="" className="dropped-photo" /> */}
        </IonModal>
      </IonContent>
    </>
  );
};

export default CropEditModal;
