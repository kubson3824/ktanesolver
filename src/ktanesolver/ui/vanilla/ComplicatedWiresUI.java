package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.Bomb;
import ktanesolver.model.vanilla.ComplicatedWireModel;
import ktanesolver.logic.vanilla.ComplicatedWireLogic;
import ktanesolver.logic.vanilla.ComplicatedWireLogic.WireAction;

/**
 * UI class for the Complicated Wires module.
 */
public class ComplicatedWiresUI extends JFrame {
    private JComboBox<String> cbColour;
    private JCheckBox chbStar;
    private JCheckBox chbLED;
    private JButton bAccept;
    private JLabel jLabel1;
    
    private Bomb bomb;
    
    /**
     * Constructor
     * @param bomb The bomb model
     */
    public ComplicatedWiresUI(Bomb bomb) {
        this.bomb = bomb;
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        bAccept = new JButton();
        cbColour = new JComboBox<>();
        jLabel1 = new JLabel();
        chbStar = new JCheckBox();
        chbLED = new JCheckBox();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Complicated Wires");

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        cbColour.setModel(new DefaultComboBoxModel<>(new String[] { "White", "Blue", "Red", "Red-Blue" }));
        jLabel1.setText("Colour");
        chbStar.setText("Star");
        chbLED.setText("LED");

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addComponent(chbLED)
                    .addComponent(chbStar)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(cbColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(jLabel1)))
                .addContainerGap(GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
            .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap(GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(bAccept)
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbColour, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(chbStar)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(chbLED)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(bAccept)
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
        // Create a complicated wire model from the UI inputs
        ComplicatedWireModel wire = new ComplicatedWireModel();
        wire.setColor(cbColour.getSelectedItem().toString());
        wire.setHasLED(chbLED.isSelected());
        wire.setHasStar(chbStar.isSelected());
        
        // Use the logic class to determine the action
        WireAction action = ComplicatedWireLogic.determineAction(wire, bomb);
        
        // Show the result
        if (action == WireAction.CUT) {
            JOptionPane.showMessageDialog(this, "Cut the wire");
        } else {
            JOptionPane.showMessageDialog(this, "Don't cut the wire");
        }
    }
}