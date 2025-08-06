'use client';

import { createPathComponent } from '@react-leaflet/core';
import L from 'leaflet';

const FeatureGroup = createPathComponent(
  function createFeatureGroup({  ...options }, ctx) {
    const instance = new L.FeatureGroup([], options);
    return { instance, context: { ...ctx, overlayContainer: instance } };
  }
);

export default FeatureGroup;