/* eslint-disable */
if (!global._babelPolyfill) {
    require('babel-polyfill');
}
import React from 'react';
import { render } from 'react-dom';
import App from './App';

render(
    <App />,
    document.getElementById('container')
);
