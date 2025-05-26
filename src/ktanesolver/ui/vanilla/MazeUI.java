package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.MazeModel;
import ktanesolver.logic.vanilla.MazeLogic;

/**
 * UI class for the Maze module.
 */
public class MazeUI extends JFrame {
    private JButton bProcess;
    private JLabel lResult;
    
    private MazeModel model;
    
    /**
     * Constructor
     */
    public MazeUI() {
        model = new MazeModel();
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        bProcess = new JButton();
        lResult = new JLabel();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Maze");

        bProcess.setText("Process Maze");
        bProcess.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bProcessActionPerformed(evt);
            }
        });

        lResult.setText("Enter maze information and click Process");

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addComponent(bProcess, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addComponent(lResult, GroupLayout.DEFAULT_SIZE, 380, Short.MAX_VALUE))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(lResult)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, 250, Short.MAX_VALUE)
                .addComponent(bProcess)
                .addContainerGap())
        );

        pack();
        setLocationRelativeTo(null);
    }
    
    /**
     * Handle the Process button click
     * @param evt The action event
     */
    private void bProcessActionPerformed(ActionEvent evt) {
        try {
            // Process the maze
            MazeLogic.processMaze(model);
            
            // Display the result
            lResult.setText(model.getResult());
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}