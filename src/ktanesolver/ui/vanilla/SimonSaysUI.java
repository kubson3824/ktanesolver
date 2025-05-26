package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.SimonSaysModel;
import ktanesolver.logic.vanilla.SimonSaysLogic;

/**
 * UI class for the Simon Says module.
 */
public class SimonSaysUI extends JFrame {
    private JComboBox<String> cbI1;
    private JComboBox<String> cbI2;
    private JComboBox<String> cbI3;
    private JComboBox<String> cbI4;
    private JComboBox<String> cbI5;
    private JLabel jLabel1;
    private JLabel jLabel2;
    private JLabel jLabel3;
    private JLabel jLabel4;
    private JLabel jLabel5;
    private JLabel jLabel6;
    private JLabel jLabel7;
    private JLabel lR1;
    private JLabel lR2;
    private JLabel lR3;
    private JLabel lR4;
    private JLabel lR5;
    private JSpinner sStrike;
    private JButton bAccept;
    
    private SimonSaysModel model;
    
    /**
     * Constructor
     */
    public SimonSaysUI() {
        model = new SimonSaysModel();
        initComponents();
    }
    
    /**
     * Constructor with serial number
     * @param serialNumber The serial number
     */
    public SimonSaysUI(String serialNumber) {
        model = new SimonSaysModel(serialNumber);
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        cbI1 = new JComboBox<>();
        cbI2 = new JComboBox<>();
        cbI3 = new JComboBox<>();
        cbI4 = new JComboBox<>();
        cbI5 = new JComboBox<>();
        jLabel1 = new JLabel();
        jLabel2 = new JLabel();
        jLabel3 = new JLabel();
        jLabel4 = new JLabel();
        jLabel5 = new JLabel();
        jLabel6 = new JLabel();
        jLabel7 = new JLabel();
        lR1 = new JLabel();
        lR2 = new JLabel();
        lR3 = new JLabel();
        lR4 = new JLabel();
        lR5 = new JLabel();
        sStrike = new JSpinner();
        bAccept = new JButton();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Simon Says");

        cbI1.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Yellow", "Green", "-" }));
        cbI1.setSelectedIndex(4);

        cbI2.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Yellow", "Green", "-" }));
        cbI2.setSelectedIndex(4);

        cbI3.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Yellow", "Green", "-" }));
        cbI3.setSelectedIndex(4);

        cbI4.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Yellow", "Green", "-" }));
        cbI4.setSelectedIndex(4);

        cbI5.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Yellow", "Green", "-" }));
        cbI5.setSelectedIndex(4);

        jLabel1.setText("1st stage");
        jLabel2.setText("2nd stage");
        jLabel3.setText("3rd stage");
        jLabel4.setText("4th stage");
        jLabel5.setText("5th stage");
        jLabel6.setText("Strikes");
        jLabel7.setText("Result:");

        sStrike.setModel(new SpinnerNumberModel(0, 0, 2, 1));

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
            .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(cbI2, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                .addGap(18, 18, 18)
                                .addComponent(jLabel2))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(cbI3, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                .addGap(18, 18, 18)
                                .addComponent(jLabel3))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(cbI4, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                .addGap(18, 18, 18)
                                .addComponent(jLabel4)))
                        .addGap(0, 0, Short.MAX_VALUE))
                    .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.TRAILING)
                            .addGroup(layout.createSequentialGroup()
                                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                                    .addComponent(cbI5, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                    .addComponent(sStrike, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                                .addGap(18, 18, 18)
                                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                                    .addComponent(jLabel5)
                                    .addComponent(jLabel6))
                                .addGap(61, 61, 61)
                                .addComponent(bAccept))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(cbI1, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                .addGap(18, 18, 18)
                                .addComponent(jLabel1)
                                .addGap(0, 0, Short.MAX_VALUE)))
                        .addGap(11, 11, 11)
                        .addComponent(jLabel7)))
                .addGap(18, 18, 18)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addComponent(lR1)
                    .addComponent(lR5)
                    .addComponent(lR2)
                    .addComponent(lR3)
                    .addComponent(lR4))
                .addGap(59, 59, 59))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbI1, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1)
                    .addComponent(lR1)
                    .addComponent(jLabel7))
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbI2, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel2)
                    .addComponent(lR2))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbI3, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel3)
                    .addComponent(lR3))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbI4, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel4)
                    .addComponent(lR4))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbI5, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel5)
                    .addComponent(lR5))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addComponent(sStrike, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel6)
                    .addComponent(bAccept))
                .addContainerGap(14, Short.MAX_VALUE))
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
            // Set the strikes in the model
            model.setStrikes((Integer) sStrike.getValue());
            
            // Set the input colors in the model
            String[] inputColors = new String[5];
            inputColors[0] = cbI1.getSelectedItem().toString();
            inputColors[1] = cbI2.getSelectedItem().toString();
            inputColors[2] = cbI3.getSelectedItem().toString();
            inputColors[3] = cbI4.getSelectedItem().toString();
            inputColors[4] = cbI5.getSelectedItem().toString();
            model.setAllInputColors(inputColors);
            
            // Determine the output colors
            SimonSaysLogic.determineOutputColors(model);
            
            // Display the output colors
            String[] outputColors = model.getAllOutputColors();
            lR1.setText(outputColors[0]);
            lR2.setText(outputColors[1]);
            lR3.setText(outputColors[2]);
            lR4.setText(outputColors[3]);
            lR5.setText(outputColors[4]);
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}