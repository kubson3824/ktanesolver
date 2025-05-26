# KTANESolver

A Java application for solving puzzles in the game "Keep Talking and Nobody Explodes".

## Building the Project

This project uses Gradle as its build system. You don't need to install Gradle separately as the project includes a Gradle wrapper.

### Prerequisites

- Java 21 or higher

### Build Commands

To build the project:

```bash
# On Unix-like systems
./gradlew build

# On Windows
gradlew.bat build
```

To run the application:

```bash
# On Unix-like systems
./gradlew run

# On Windows
gradlew.bat run
```

To create a distributable JAR file:

```bash
# On Unix-like systems
./gradlew jar

# On Windows
gradlew.bat jar
```

The JAR file will be created in the `build/libs` directory.

## Project Structure

- `src/ktanesolver`: Contains the main application code
  - `model`: Contains data classes that represent the state of the bomb and modules
    - `vanilla`: Models for vanilla (original game) modules
    - `modded`: Models for modded (community-created) modules
  - `logic`: Contains business logic for solving modules
    - `vanilla`: Logic for vanilla modules
    - `modded`: Logic for modded modules
  - `ui`: Contains UI components for the application
    - `vanilla`: UI for vanilla modules
    - `modded`: UI for modded modules
- `src/KTANEResources`: Contains resources used by the application

### Architecture

The project has been refactored to separate UI and logic:

1. **Model Layer**: Data classes that represent the state of the bomb and modules
   - `Bomb`: Represents the bomb's properties (serial number, indicators, batteries, ports, etc.)
   - Module-specific model classes (e.g., `ButtonModel`)

2. **Logic Layer**: Business logic for solving modules
   - Module-specific logic classes (e.g., `ButtonLogic`)

3. **UI Layer**: User interface components
   - `MenuUI`: Main menu for the application
   - Module-specific UI classes (e.g., `ButtonUI`)

This separation of concerns makes the code more maintainable and testable.

## Converting from Ant to Gradle

This project was originally built using Apache Ant and has been converted to use Gradle. The original Ant build files (`build.xml` and files in `nbproject/`) are kept for reference but are no longer used for building the project.

## Java Version

This project has been updated to use Java 21. If you're using an older version of Java, you'll need to upgrade to Java 21 or higher to build and run the project.
