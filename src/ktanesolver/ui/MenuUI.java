package ktanesolver.ui;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;

import ktanesolver.model.Bomb;
import ktanesolver.ui.vanilla.*;

/**
 * Main menu UI for the KTANE Solver application.
 */
public class MenuUI extends JFrame {
    // Bomb model
    private Bomb bomb;

    // UI Components
    private JTextField tfSerial;
    private JTextField tfLitInd;
    private JTextField tfUnlitInd;
    private JLabel jLabel1;
    private JLabel jLabel2;
    private JLabel jLabel3;
    private JLabel jLabel4;
    private JLabel jLabel5;
    private JLabel jLabel6;
    private JLabel jLabel7;
    private JLabel jLabel8;
    private JLabel jLabel9;
    private JLabel jLabel10;
    private JLabel jLabel11;
    private JLabel jLabel12;
    private JLabel jLabel13;
    private JLabel jLabel14;
    private JLabel jLabel15;
    private JLabel jLabel16;
    private JLabel jLabel17;
    private JComboBox<String> cbRegular;
    private JComboBox<String> cbNeedy;
    private JButton bRegular;
    private JButton bNeedy;
    private JComboBox<String> cbRegularModded;
    private JButton bModdedRegular;
    private JComboBox<String> cbNeedyModded;
    private JButton bModdedNeedy;
    private JSpinner sAA;
    private JSpinner sD;
    private JSpinner sHold;
    private JSpinner sPlate;
    private JSpinner sDVI;
    private JSpinner sParallel;
    private JSpinner sPS2;
    private JSpinner sRJ45;
    private JSpinner sSerial;
    private JSpinner sStereo;
    private JSpinner sEmpty;
    private JSpinner sAmount;
    private JSpinner sSolved;
    private JSpinner sStartTime;
    private JButton bRestart;

    /**
     * Constructor
     */
    public MenuUI() {
        bomb = new Bomb();
        initComponents();
    }

    /**
     * Initialize the UI components
     */
    private void initComponents() {
        tfSerial = new JTextField();
        tfLitInd = new JTextField();
        tfUnlitInd = new JTextField();
        jLabel1 = new JLabel();
        jLabel2 = new JLabel();
        jLabel3 = new JLabel();
        jLabel4 = new JLabel();
        jLabel5 = new JLabel();
        jLabel6 = new JLabel();
        jLabel7 = new JLabel();
        jLabel8 = new JLabel();
        jLabel9 = new JLabel();
        jLabel10 = new JLabel();
        jLabel11 = new JLabel();
        jLabel12 = new JLabel();
        jLabel13 = new JLabel();
        jLabel14 = new JLabel();
        jLabel15 = new JLabel();
        jLabel16 = new JLabel();
        jLabel17 = new JLabel();
        cbRegular = new JComboBox<>();
        cbNeedy = new JComboBox<>();
        bRegular = new JButton();
        bNeedy = new JButton();
        cbRegularModded = new JComboBox<>();
        bModdedRegular = new JButton();
        cbNeedyModded = new JComboBox<>();
        bModdedNeedy = new JButton();
        sAA = new JSpinner();
        sD = new JSpinner();
        sHold = new JSpinner();
        sPlate = new JSpinner();
        sDVI = new JSpinner();
        sParallel = new JSpinner();
        sPS2 = new JSpinner();
        sRJ45 = new JSpinner();
        sSerial = new JSpinner();
        sStereo = new JSpinner();
        sEmpty = new JSpinner();
        sAmount = new JSpinner();
        sSolved = new JSpinner();
        sStartTime = new JSpinner();
        bRestart = new JButton();

        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        setTitle("KTANE Solver");

        tfSerial.addFocusListener(new FocusAdapter() {
            public void focusLost(FocusEvent evt) {
                tfSerialFocusLost(evt);
            }
        });

        tfLitInd.setToolTipText("");
        tfLitInd.addFocusListener(new FocusAdapter() {
            public void focusLost(FocusEvent evt) {
                tfLitIndFocusLost(evt);
            }
        });

        tfUnlitInd.addFocusListener(new FocusAdapter() {
            public void focusLost(FocusEvent evt) {
                tfUnlitIndFocusLost(evt);
            }
        });

        jLabel1.setText("Serial Number");
        jLabel2.setText("AA Batteries");
        jLabel3.setText("D Batteries");
        jLabel4.setText("Battery holders");
        jLabel5.setText("Port plates");
        jLabel6.setText("DVI");
        jLabel7.setText("Parallel");
        jLabel8.setText("PS/2");
        jLabel9.setText("RJ-45");
        jLabel10.setText("Serial port");
        jLabel11.setText("Stereo RCA");
        jLabel12.setText("Unlit indicators");
        jLabel13.setText("Lit indicators");
        jLabel14.setText("Empty port plates");
        jLabel15.setText("Amount of modules");
        jLabel16.setText("Amount of solved modules");
        jLabel17.setText("Starting time in seconds");

        cbRegular.setModel(new DefaultComboBoxModel<>(new String[]{"Button", "Complicated Wires", "Keypads", "Mazes", "Memory", "Morse Code", "Passwords", "Simon Says", "Who's on First", "Wire Sequences", "Wires"}));
        cbNeedy.setModel(new DefaultComboBoxModel<>(new String[]{"Knobs"}));
        cbRegularModded.setModel(new DefaultComboBoxModel<>(new String[]{"Adjacent Letters", "Adventure Game", "Astrology", "Bitwise Operators", "Boolean Venn Diagram", "Blind Alley", "Caesar Cipher", "Colored Squares", "Lettered Keys", "Logic", "Morsematics", "Plumbing"}));
        cbNeedyModded.setModel(new DefaultComboBoxModel<>(new String[]{"Hex To Decimal"}));

        bRegular.setText("Regular");
        bRegular.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bRegularActionPerformed(evt);
            }
        });

        bNeedy.setText("Needy");
        bNeedy.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bNeedyActionPerformed(evt);
            }
        });

        bModdedRegular.setText("Mod Regular");
        bModdedRegular.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bModdedRegularActionPerformed(evt);
            }
        });

        bModdedNeedy.setText("Mod Needy");
        bModdedNeedy.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bModdedNeedyActionPerformed(evt);
            }
        });

        sAA.setModel(new SpinnerNumberModel(0, 0, null, 2));
        sD.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sHold.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sPlate.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sDVI.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sParallel.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sPS2.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sRJ45.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sSerial.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sStereo.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sEmpty.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sAmount.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sSolved.setModel(new SpinnerNumberModel(0, 0, null, 1));
        sStartTime.setModel(new SpinnerNumberModel(0, 0, null, 1));

        bRestart.setText("Clear all");
        bRestart.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bRestartActionPerformed(evt);
            }
        });

        // Create a simple layout for now
        setLayout(new BorderLayout());

        // Create panels for different sections
        JPanel topPanel = new JPanel(new GridLayout(0, 4, 10, 5));
        JPanel bottomPanel = new JPanel(new GridLayout(0, 4, 10, 5));

        // Add components to top panel (bomb properties)
        topPanel.add(jLabel1);
        topPanel.add(tfSerial);
        topPanel.add(jLabel13);
        topPanel.add(tfLitInd);

        topPanel.add(jLabel12);
        topPanel.add(tfUnlitInd);
        topPanel.add(jLabel2);
        topPanel.add(sAA);

        topPanel.add(jLabel3);
        topPanel.add(sD);
        topPanel.add(jLabel4);
        topPanel.add(sHold);

        topPanel.add(jLabel5);
        topPanel.add(sPlate);
        topPanel.add(jLabel14);
        topPanel.add(sEmpty);

        topPanel.add(jLabel6);
        topPanel.add(sDVI);
        topPanel.add(jLabel7);
        topPanel.add(sParallel);

        topPanel.add(jLabel8);
        topPanel.add(sPS2);
        topPanel.add(jLabel9);
        topPanel.add(sRJ45);

        topPanel.add(jLabel10);
        topPanel.add(sSerial);
        topPanel.add(jLabel11);
        topPanel.add(sStereo);

        topPanel.add(jLabel15);
        topPanel.add(sAmount);
        topPanel.add(jLabel16);
        topPanel.add(sSolved);

        topPanel.add(jLabel17);
        topPanel.add(sStartTime);
        topPanel.add(new JLabel()); // Empty space
        topPanel.add(bRestart);

        // Add components to bottom panel (module selection)
        bottomPanel.add(cbRegular);
        bottomPanel.add(bRegular);
        bottomPanel.add(cbNeedy);
        bottomPanel.add(bNeedy);

        bottomPanel.add(cbRegularModded);
        bottomPanel.add(bModdedRegular);
        bottomPanel.add(cbNeedyModded);
        bottomPanel.add(bModdedNeedy);

        // Add panels to the frame
        add(topPanel, BorderLayout.CENTER);
        add(bottomPanel, BorderLayout.SOUTH);

        // Set size and position
        setSize(800, 600);
        setLocationRelativeTo(null);
    }

    /**
     * Update the bomb model with the current UI values
     */
    private void updateBombModel() {
        bomb.setSerialNumber(tfSerial.getText());

        // Set lit indicators
        String litIndText = tfLitInd.getText().trim();
        if (litIndText.isEmpty()) {
            bomb.setLitIndicators(null);
        } else {
            bomb.setLitIndicators(litIndText.split(" "));
        }

        // Set unlit indicators
        String unlitIndText = tfUnlitInd.getText().trim();
        if (unlitIndText.isEmpty()) {
            bomb.setUnlitIndicators(null);
        } else {
            bomb.setUnlitIndicators(unlitIndText.split(" "));
        }

        // Set battery and port values
        bomb.setBatteriesAA((Integer) sAA.getValue());
        bomb.setBatteriesD((Integer) sD.getValue());
        bomb.setBatteryHolders((Integer) sHold.getValue());
        bomb.setPortPlates((Integer) sPlate.getValue());
        bomb.setPortDVI((Integer) sDVI.getValue());
        bomb.setPortParallel((Integer) sParallel.getValue());
        bomb.setPortPS2((Integer) sPS2.getValue());
        bomb.setPortRJ45((Integer) sRJ45.getValue());
        bomb.setPortSerial((Integer) sSerial.getValue());
        bomb.setPortStereoRCA((Integer) sStereo.getValue());
        bomb.setEmptyPortPlates((Integer) sEmpty.getValue());

        // Set other values
        bomb.setTotalModules((Integer) sAmount.getValue());
        bomb.setSolvedModules((Integer) sSolved.getValue());
        bomb.setStartTime((Integer) sStartTime.getValue());

        // Calculate derived properties
        bomb.calculateDerivedProperties();
    }

    private void tfSerialFocusLost(FocusEvent evt) {
        tfSerial.setText(tfSerial.getText().toUpperCase());
    }

    private void tfLitIndFocusLost(FocusEvent evt) {
        tfLitInd.setText(tfLitInd.getText().toUpperCase());
    }

    private void tfUnlitIndFocusLost(FocusEvent evt) {
        tfUnlitInd.setText(tfUnlitInd.getText().toUpperCase());
    }

    private void bRegularActionPerformed(ActionEvent evt) {
        updateBombModel();

        String selectedModule = cbRegular.getSelectedItem().toString().toLowerCase();
        switchForRegularModule(selectedModule);
    }

    private void switchForRegularModule(String selectedModule) {
        switch (selectedModule) {
            case "button":
                ButtonUI buttonUI = new ButtonUI(bomb);
                buttonUI.setVisible(true);
                break;
            case "complicated wires":
                ComplicatedWiresUI complicatedWiresUI = new ComplicatedWiresUI(bomb);
                complicatedWiresUI.setVisible(true);
                break;
            case "keypads":
                KeypadsUI keypadsUI = new KeypadsUI();
                keypadsUI.setVisible(true);
                break;
            case "mazes":
                MazeUI mazeUI = new MazeUI();
                mazeUI.setVisible(true);
                break;
            case "memory":
                MemoryUI memoryUI = new MemoryUI();
                memoryUI.setVisible(true);
                break;
            case "morse code":
                MorseCodeUI morseCodeUI = new MorseCodeUI();
                morseCodeUI.setVisible(true);
                break;
            case "passwords":
                PasswordsUI passwordsUI = new PasswordsUI();
                passwordsUI.setVisible(true);
                break;
            case "simon says":
                SimonSaysUI simonSaysUI = new SimonSaysUI(bomb.getSerialNumber());
                simonSaysUI.setVisible(true);
                break;
            case "who's on first":
                WhosOnFirstUI whosOnFirstUI = new WhosOnFirstUI();
                whosOnFirstUI.setVisible(true);
                break;
            case "wire sequences":
                WireSequenceUI wireSequenceUI = new WireSequenceUI();
                wireSequenceUI.setVisible(true);
                break;
            case "wires":
                WiresUI wiresUI = new WiresUI(bomb.getSerialNumber().toCharArray());
                wiresUI.setVisible(true);
                break;
            // Other modules would be added here
            default:
                JOptionPane.showMessageDialog(this, "Module not implemented yet: " + selectedModule);
                break;
        }
    }

    private void bNeedyActionPerformed(ActionEvent evt) {
        updateBombModel();

        String selectedModule = cbNeedy.getSelectedItem().toString().toLowerCase();
        // Implement needy modules here
        JOptionPane.showMessageDialog(this, "Needy module not implemented yet: " + selectedModule);
    }

    private void bModdedRegularActionPerformed(ActionEvent evt) {
        updateBombModel();

        String selectedModule = cbRegularModded.getSelectedItem().toString().toLowerCase();
        // Implement modded regular modules here
        JOptionPane.showMessageDialog(this, "Modded regular module not implemented yet: " + selectedModule);
    }

    private void bModdedNeedyActionPerformed(ActionEvent evt) {
        updateBombModel();

        String selectedModule = cbNeedyModded.getSelectedItem().toString().toLowerCase();
        // Implement modded needy modules here
        JOptionPane.showMessageDialog(this, "Modded needy module not implemented yet: " + selectedModule);
    }

    private void bRestartActionPerformed(ActionEvent evt) {
        tfLitInd.setText("");
        tfSerial.setText("");
        tfUnlitInd.setText("");
        sAA.setValue(0);
        sAmount.setValue(0);
        sD.setValue(0);
        sDVI.setValue(0);
        sEmpty.setValue(0);
        sHold.setValue(0);
        sPS2.setValue(0);
        sParallel.setValue(0);
        sPlate.setValue(0);
        sRJ45.setValue(0);
        sSerial.setValue(0);
        sSolved.setValue(0);
        sStartTime.setValue(0);
        sStereo.setValue(0);

        // Reset the bomb model
        bomb = new Bomb();
    }

    /**
     * Main method
     */
    public static void main(String args[]) {
        try {
            for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (ClassNotFoundException | InstantiationException | IllegalAccessException | UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(MenuUI.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }

        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new MenuUI().setVisible(true);
            }
        });
    }
}
