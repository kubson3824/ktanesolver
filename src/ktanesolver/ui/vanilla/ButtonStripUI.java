package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.Bomb;
import ktanesolver.model.vanilla.ButtonStripModel;
import ktanesolver.logic.vanilla.ButtonLogic;

/**
 * UI class for the Button Strip module.
 */
public class ButtonStripUI extends JFrame {
    private JComboBox<String> cbStripColour;
    private JButton bAccept;
    private JLabel jLabel1;
    
    private Bomb bomb;
    
    /**
     * Constructor
     * @param bomb The bomb model
     */
    public ButtonStripUI(Bomb bomb) {
        this.bomb = bomb;
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        jLabel1 = new JLabel();
        cbStripColour = new JComboBox<>();
        bAccept = new JButton();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Button Strip");

        jLabel1.setText("Choose the colour of the strip");

        cbStripColour.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "White", "Yellow", "Different from above" }));

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
                .addComponent(jLabel1)
                .addGap(18, 18, 18)
                .addComponent(cbStripColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                .addContainerGap(GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
            .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap(GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(bAccept)
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addComponent(cbStripColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1))
                .addPreferredGap(LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(bAccept)
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
        // Create a button strip model from the UI inputs
        ButtonStripModel strip = new ButtonStripModel();
        strip.setStripColor(cbStripColour.getSelectedItem().toString());
        
        // Use the logic class to determine when to release
        String releaseTime = ButtonLogic.determineReleaseTime(strip);
        
        // Show the result
        JOptionPane.showMessageDialog(this, releaseTime);
        this.dispose();
    }
}