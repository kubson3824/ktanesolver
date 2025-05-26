package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.WireSequenceModel;
import ktanesolver.logic.vanilla.WireSequenceLogic;

/**
 * UI class for the Wire Sequence module.
 */
public class WireSequenceUI extends JFrame {
    private JComboBox<String> cbColour;
    private JComboBox<String> cbLetter;
    private JLabel jLabel1;
    private JLabel jLabel2;
    private JButton bAccept;
    private JButton bReset;
    
    private WireSequenceModel model;
    
    /**
     * Constructor
     */
    public WireSequenceUI() {
        model = new WireSequenceModel();
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        cbColour = new JComboBox<>();
        cbLetter = new JComboBox<>();
        jLabel1 = new JLabel();
        jLabel2 = new JLabel();
        bAccept = new JButton();
        bReset = new JButton();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Wire Sequence");

        cbColour.setModel(new DefaultComboBoxModel<>(new String[] { "Red", "Blue", "Black" }));
        cbLetter.setModel(new DefaultComboBoxModel<>(new String[] { "A", "B", "C" }));

        jLabel1.setText("Colour");
        jLabel2.setText("Letter");

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        bReset.setText("Reset");
        bReset.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bResetActionPerformed(evt);
            }
        });

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(cbColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.UNRELATED)
                        .addComponent(jLabel1)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(bAccept)
                        .addContainerGap(GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(cbLetter, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.UNRELATED)
                        .addComponent(jLabel2)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(bReset)
                        .addGap(0, 0, Short.MAX_VALUE))))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1)
                    .addComponent(bAccept))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbLetter, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel2)
                    .addComponent(bReset))
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
        try {
            // Set the color and letter in the model
            model.setColor(cbColour.getSelectedItem().toString().toLowerCase());
            model.setLetter(cbLetter.getSelectedItem().toString().toUpperCase());
            
            // Process the wire sequence
            WireSequenceLogic.processWireSequence(model);
            
            // Display the result
            JOptionPane.showMessageDialog(this, model.getResult());
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
    
    /**
     * Handle the Reset button click
     * @param evt The action event
     */
    private void bResetActionPerformed(ActionEvent evt) {
        try {
            // Reset the counters
            WireSequenceLogic.resetCounters(model);
            
            JOptionPane.showMessageDialog(this, "Counters reset");
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}