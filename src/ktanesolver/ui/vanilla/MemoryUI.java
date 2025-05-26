package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.MemoryModel;
import ktanesolver.logic.vanilla.MemoryLogic;

/**
 * UI class for the Memory module.
 */
public class MemoryUI extends JFrame {
    private JSpinner sDisplay;
    private JButton bAccept;
    private JLabel jLabel1;
    
    private MemoryModel model;
    
    /**
     * Constructor
     */
    public MemoryUI() {
        model = new MemoryModel();
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        bAccept = new JButton();
        sDisplay = new JSpinner();
        jLabel1 = new JLabel();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Memory");

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        sDisplay.setModel(new SpinnerNumberModel(1, 1, 4, 1));
        jLabel1.setText("Number on the display");

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(sDisplay, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jLabel1)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(bAccept)
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(bAccept)
                    .addComponent(sDisplay, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1))
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
        // Check if we've completed all stages
        if (model.getStage() == 5) {
            this.dispose();
            return;
        }
        
        // Increment the stage
        model.incrementStage();
        
        // Get the display number
        int display = (Integer) sDisplay.getValue();
        model.setDisplay(display);
        
        // Determine the position to press
        int position = MemoryLogic.determinePositionToPress(model);
        
        // Get the instruction
        String instruction = MemoryLogic.getInstruction(model);
        
        // Show the instruction
        if (model.getStage() == 5) {
            // Final stage, just show the instruction
            JOptionPane.showMessageDialog(this, instruction);
        } else {
            // Ask for the number on the button
            String input = JOptionPane.showInputDialog(this, instruction);
            try {
                int number = Integer.parseInt(input);
                
                // Update the model with the position and number
                MemoryLogic.updateStage(model, position, number);
            } catch (NumberFormatException e) {
                JOptionPane.showMessageDialog(this, "Please enter a valid number", "Error", JOptionPane.ERROR_MESSAGE);
                // Decrement the stage since we didn't get a valid input
                model.setStage(model.getStage() - 1);
            }
        }
    }
}