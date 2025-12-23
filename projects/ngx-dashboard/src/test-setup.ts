// Zone.js is required for fakeAsync testing helper
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Initialize the Angular testing environment
// Note: The app runs zoneless, but tests use zone.js for fakeAsync helper
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);