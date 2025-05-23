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
- `src/KTANEResources`: Contains resources used by the application

## Converting from Ant to Gradle

This project was originally built using Apache Ant and has been converted to use Gradle. The original Ant build files (`build.xml` and files in `nbproject/`) are kept for reference but are no longer used for building the project.

## Java Version

This project has been updated to use Java 21. If you're using an older version of Java, you'll need to upgrade to Java 21 or higher to build and run the project.
