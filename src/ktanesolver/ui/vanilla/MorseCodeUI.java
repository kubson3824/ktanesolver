package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.MorseCodeModel;
import ktanesolver.logic.vanilla.MorseCodeLogic;

/**
 * UI class for the Morse Code module.
 */
public class MorseCodeUI extends JFrame {
    private JTextField tfCode;
    private JButton bAccept;
    private JLabel jLabel1;
    private JLabel lResult;
    
    private MorseCodeModel model;
    
    /**
     * Constructor
     */
    public MorseCodeUI() {
        model = new MorseCodeModel();
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        tfCode = new JTextField();
        jLabel1 = new JLabel();
        bAccept = new JButton();
        lResult = new JLabel();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Morse Code");

        jLabel1.setHorizontalAlignment(SwingConstants.CENTER);
        jLabel1.setText("Input the code below");

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addComponent(tfCode)
                    .addComponent(jLabel1, GroupLayout.DEFAULT_SIZE, 196, Short.MAX_VALUE)
                    .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addComponent(lResult)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(bAccept)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGap(13, 13, 13)
                .addComponent(jLabel1)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(tfCode, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(bAccept)
                    .addComponent(lResult))
                .addContainerGap(GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        pack();
        setLocationRelativeTo(null);
    }
    
    /**
     * Handle the OK button click
     * @param evt The action event
     */
    private void bAcceptActionPerformed(ActionEvent evt) {
        // Get the Morse code from the text field
        String morseCode = tfCode.getText();
        
        // Set the Morse code in the model
        model.setMorseCode(morseCode);
        
        // Decode the Morse code and determine the frequency
        MorseCodeLogic.decodeAndDetermineFrequency(model);
        
        // Display the frequency
        lResult.setText("Frequency: " + model.getFrequency());
    }
}