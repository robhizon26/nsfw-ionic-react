NSFW JS is originally from [Infinite Red](https://infinite.red/). I wrapped the [web app](https://nsfwjs.com/) using Ionic React so that I can use the device camera seamlessly. I also added a small functionality to crop the photo taken by the camera.

NSFW(Not Safe for Work) JS is a React app that uses TensorflowJS (hence the suffix JS) to classify images if it safe to view at work or not. This is particularly checking on pornography images.

You can check out their original source code [here](https://github.com/infinitered/nsfwjs).
 

## How to run this project on the browser

You can run this project by:

1) running `npm i` or `npm install` on the terminal. This will look at and install all the dependecies in package.json.
2) running `npm start` to open the app on the browser.

## How to run this project as Android app using Android Studio.

Prior to doing the steps below, be sure you have installed Android Studio on your machine. 

1) Run `npm run build` on the terminal. This will build and transpile the react app that will be merged and synced later on in the Android app.
2) Run `ionic capacitor sync android` to sync and merge the web app to the Android app that you will see under the android folder. If this folder doesn't exist yet, it will create it along with its content.
3) Run `ionic capacitor run android` to open the app on Android Studio.

