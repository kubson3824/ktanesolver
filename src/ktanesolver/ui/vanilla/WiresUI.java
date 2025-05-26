package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.WiresModel;
import ktanesolver.logic.vanilla.WiresLogic;

/**
 * UI class for the Wires module.
 */
public class WiresUI extends JFrame {
    private JButton bAccept;
    private JComboBox<String> cbFirst;
    private JComboBox<String> cbSecond;
    private JComboBox<String> cbThird;
    private JComboBox<String> cbFourth;
    private JComboBox<String> cbFifth;
    private JComboBox<String> cbSixth;
    private JLabel jLabel2;
    private JLabel jLabel3;
    private JLabel jLabel4;
    private JLabel jLabel5;
    private JLabel jLabel6;
    private JLabel jLabel7;
    
    private WiresModel model;
    
    /**
     * Constructor
     */
    public WiresUI() {
        model = new WiresModel();
        initComponents();
    }
    
    /**
     * Constructor with serial number
     * @param serial The serial number
     */
    public WiresUI(char[] serial) {
        model = new WiresModel(serial);
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        bAccept = new JButton();
        cbFirst = new JComboBox<>();
        cbSecond = new JComboBox<>();
        cbThird = new JComboBox<>();
        cbFourth = new JComboBox<>();
        cbFifth = new JComboBox<>();
        cbSixth = new JComboBox<>();
        jLabel2 = new JLabel();
        jLabel3 = new JLabel();
        jLabel4 = new JLabel();
        jLabel5 = new JLabel();
        jLabel6 = new JLabel();
        jLabel7 = new JLabel();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Wires");

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        cbFirst.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Black", "Yellow", "White", "-" }));
        cbFirst.setSelectedIndex(5);

        jLabel2.setText("1st wire");
        jLabel3.setText("2nd wire");
        jLabel4.setText("3rd wire");
        jLabel5.setText("4th wire");
        jLabel6.setText("5th wire");
        jLabel7.setText("6th wire");

        cbSecond.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Black", "Yellow", "White", "-" }));
        cbSecond.setSelectedIndex(5);

        cbThird.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Black", "Yellow", "White", "-" }));
        cbThird.setSelectedIndex(5);

        cbFourth.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Black", "Yellow", "White", "-" }));
        cbFourth.setSelectedIndex(5);

        cbFifth.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Black", "Yellow", "White", "-" }));
        cbFifth.setSelectedIndex(5);

        cbSixth.setModel(new DefaultComboBoxModel<>(new String[] { "Blue", "Red", "Black", "Yellow", "White", "-" }));
        cbSixth.setSelectedIndex(5);

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGap(40, 40, 40)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.CENTER)
                    .addComponent(bAccept, GroupLayout.Alignment.LEADING, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel6, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addGroup(layout.createSequentialGroup()
                                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                                    .addComponent(jLabel4, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(jLabel5, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(jLabel7, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                                .addGap(2, 2, 2)))
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                            .addComponent(cbSixth, 0, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addComponent(cbFifth, 0, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addComponent(cbFourth, 0, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                                .addGap(0, 0, Short.MAX_VALUE)
                                .addComponent(cbThird, GroupLayout.PREFERRED_SIZE, 137, GroupLayout.PREFERRED_SIZE))))
                    .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addGap(2, 2, 2)
                                .addComponent(jLabel2, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                            .addComponent(jLabel3, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                            .addComponent(cbSecond, GroupLayout.PREFERRED_SIZE, 136, GroupLayout.PREFERRED_SIZE)
                            .addComponent(cbFirst, GroupLayout.PREFERRED_SIZE, 137, GroupLayout.PREFERRED_SIZE))))
                .addGap(34, 34, 34))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(6, 6, 6)
                        .addComponent(jLabel2, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                    .addComponent(cbFirst, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addGap(9, 9, 9)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(6, 6, 6)
                        .addComponent(jLabel3, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                    .addComponent(cbSecond, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addGap(9, 9, 9)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(6, 6, 6)
                        .addComponent(jLabel4, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                    .addComponent(cbThird, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addGap(9, 9, 9)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(6, 6, 6)
                        .addComponent(jLabel5, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                    .addComponent(cbFourth, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addGap(6, 6, 6)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(6, 6, 6)
                        .addComponent(jLabel6, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                    .addComponent(cbFifth, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addGap(6, 6, 6)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(6, 6, 6)
                        .addComponent(jLabel7, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                    .addComponent(cbSixth, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(bAccept, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
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
        try {
            // Get the wire colors from the combo boxes
            String[] input = new String[6];
            input[0] = cbFirst.getSelectedItem().toString().toLowerCase();
            input[1] = cbSecond.getSelectedItem().toString().toLowerCase();
            input[2] = cbThird.getSelectedItem().toString().toLowerCase();
            input[3] = cbFourth.getSelectedItem().toString().toLowerCase();
            input[4] = cbFifth.getSelectedItem().toString().toLowerCase();
            input[5] = cbSixth.getSelectedItem().toString().toLowerCase();
            
            // Set the input in the model
            model.setInput(input);
            
            // Process the wires
            WiresLogic.processWires(model);
            
            // Display the result
            JOptionPane.showMessageDialog(this, model.getResult());
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}