import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<main><h1>Hello World!</h1></main>',
  styles: [
    `
      main {
        min-height: 100vh;
        display: grid;
        place-items: center;
      }

      h1 {
        font-family: Arial, sans-serif;
      }
    `
  ]
})
class AppComponent {}

bootstrapApplication(AppComponent).catch((error: unknown) => console.error(error));