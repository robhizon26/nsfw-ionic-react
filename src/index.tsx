import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import MApp from './MApp';
import * as serviceWorker from './serviceWorker';
import TApp from './TApp';
import BApp from './BApp';
// import '@ionic/pwa-elements';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

ReactDOM.render(<App />, document.getElementById('root'));

// Call the element loader after the app has been rendered the first time
defineCustomElements(window);


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
