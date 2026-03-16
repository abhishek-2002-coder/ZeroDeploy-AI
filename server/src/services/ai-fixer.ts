export class AIStudio {
  static suggestFix(errorLog: string): string {
    if (errorLog.toLowerCase().includes('missing script: build')) {
      return 'The project is missing a build script in package.json. Try adding "build": "next build" or "react-scripts build".';
    }
    if (errorLog.toLowerCase().includes('module not found')) {
      return 'Some dependencies are missing. Ensure all required packages are listed in your package.json or requirements.txt.';
    }
    if (errorLog.toLowerCase().includes('permission denied')) {
      return 'The build process encountered a permission error. This might be due to incorrect Docker configuration.';
    }
    if (errorLog.toLowerCase().includes('npm install')) {
      return 'Failed to install dependencies. Check your internet connection or package names.';
    }
    
    return 'The AI analyzer suggests checking your framework configuration and build settings.';
  }
}
