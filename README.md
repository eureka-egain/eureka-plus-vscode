# Eureka Plus VS Code Extension

![logo](https://github.com/eureka-egain/eureka-plus-vscode/blob/main/assets/logo/logo_text.png, "logo")

Eureka Plus is a Visual Studio Code extension designed to streamline test creation, management, and execution for your projects using Playwright. It provides an intuitive tree view for managing test cases, commands for recording (codegen) and running tests, and comes bundled with all the tools requried.

---

## Features

- **Test Explorer**: View and manage test cases in a hierarchical tree view.
- **Record New Tests**: Easily record new tests using Playwright.
- **Run Tests**: Execute individual tests, all tests in a folder, or all tests in the project.
- **Customizable Settings**: Configure test folders, recording options, and more.
- **File and Folder Watching**: Automatically updates the tree view when files or folders change.
- **Quick Commands**: Access frequently used actions like refreshing the tree view or opening settings.

---

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/eureka-egain/eureka-plus-vscode.git
   ```

2. Navigate to the project directory:

   ```bash
   cd eureka-plus-vscode
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Open the project in Visual Studio Code:

   ```bash
   code .
   ```

5. Press `F5` to launch the extension in a new Extension Development Host window.

---

## Getting a Local Version Up and Running

To test and develop the extension locally, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/eureka-egain/eureka-plus-vscode.git
   ```

2. **Install Dependencies**:
   Navigate to the project directory and install the required dependencies:

   ```bash
   cd eureka-plus-vscode
   npm install
   ```

3. **Open the Project in VS Code**:
   Open the project folder in Visual Studio Code:

   ```bash
   code .
   ```

4. **Run the Extension**:

   - Press `F5` to start the extension in a new Extension Development Host window.
   - This will allow you to test the extension in a sandboxed environment.

5. **Make Changes**:

   - Modify the source code in the `src` directory as needed.
   - Save your changes, and the Extension Development Host will automatically reload.

6. **Test Commands**:

   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
   - Run commands like `Eureka+: Record New Test` or `Eureka+: Refresh Tree View` to test functionality.

7. **Debugging**:
   - Use the Debug Console in the Extension Development Host to view logs and debug issues.

---

## Contributing

Contributions are welcome! If you have ideas for new features or find a bug, feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

- Built with [Visual Studio Code API](https://code.visualstudio.com/api).
- Powered by [Playwright](https://playwright.dev/).
