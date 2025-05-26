package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.Bomb;
import ktanesolver.model.vanilla.ButtonModel;
import ktanesolver.logic.vanilla.ButtonLogic;
import ktanesolver.logic.vanilla.ButtonLogic.ButtonAction;

/**
 * UI class for the Button module.
 */
public class ButtonUI extends JFrame {
    private JComboBox<String> cbColour;
    private JComboBox<String> cbText;
    private JButton bAccept;
    private JLabel jLabel1;
    private JLabel jLabel2;
    
    private Bomb bomb;
    
    /**
     * Constructor
     * @param bomb The bomb model
     */
    public ButtonUI(Bomb bomb) {
        this.bomb = bomb;
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        bAccept = new JButton();
        jLabel1 = new JLabel();
        jLabel2 = new JLabel();
        cbColour = new JComboBox<>();
        cbText = new JComboBox<>();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Button");

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        jLabel1.setText("Colour");
        jLabel2.setText("Text");

        cbColour.setModel(new DefaultComboBoxModel<>(new String[] { "Red", "White", "Blue", "Yellow" }));
        cbText.setModel(new DefaultComboBoxModel<>(new String[] { "Detonate", "Hold", "Press", "Abort" }));

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel1)
                    .addComponent(jLabel2))
                .addGap(18, 18, 18)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(cbText, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, 24, Short.MAX_VALUE)
                        .addComponent(bAccept))
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(cbColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                        .addGap(0, 0, Short.MAX_VALUE)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel1)
                    .addComponent(cbColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, 24, Short.MAX_VALUE)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel2)
                    .addComponent(cbText, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(bAccept))
                .addContainerGap())
        );

        pack();
        setLocationRelativeTo(null);
    }
    
    /**
     * Handle the OK button click
     * @param evt The action event
     */
    private void bAcceptActionPerformed(ActionEvent evt) {
        // Create a button model from the UI inputs
        ButtonModel button = new ButtonModel();
        button.setColor(cbColour.getSelectedItem().toString());
        button.setText(cbText.getSelectedItem().toString());
        
        // Use the logic class to determine the action
        ButtonAction action = ButtonLogic.determineAction(button, bomb);
        
        // Take the appropriate action
        if (action == ButtonAction.PUSH) {
            JOptionPane.showMessageDialog(this, "Press and immediately release");
        } else {
            // Show the button strip UI
            ButtonStripUI stripUI = new ButtonStripUI(bomb);
            stripUI.setVisible(true);
        }
    }
}