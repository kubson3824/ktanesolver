package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.KeypadModel;
import ktanesolver.logic.vanilla.KeypadLogic;

/**
 * UI class for the Keypads module.
 */
public class KeypadsUI extends JFrame {
    private JTextField tfInput;
    private JButton bAccept;
    private JLabel jLabel1;
    private JLabel jLabel2;
    private JLabel lList;
    private JLabel lS1;
    private JLabel lS2;
    private JLabel lS3;
    private JLabel lS4;
    
    /**
     * Constructor
     */
    public KeypadsUI() {
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        lList = new JLabel();
        tfInput = new JTextField();
        jLabel1 = new JLabel();
        jLabel2 = new JLabel();
        bAccept = new JButton();
        lS1 = new JLabel();
        lS2 = new JLabel();
        lS3 = new JLabel();
        lS4 = new JLabel();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Keypads");

        lList.setIcon(new ImageIcon(getClass().getResource("/KTANEResources/Lista.jpg")));

        jLabel1.setHorizontalAlignment(SwingConstants.LEFT);
        jLabel1.setText("Type in the numbers of symbols that");
        jLabel1.setVerticalTextPosition(SwingConstants.TOP);

        jLabel2.setText("appear on the module");

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        lS1.setText("1");
        lS2.setText("2");
        lS3.setText("3");
        lS4.setText("4");

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addComponent(lList)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGap(18, 18, 18)
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING, false)
                            .addComponent(jLabel1, GroupLayout.DEFAULT_SIZE, 199, Short.MAX_VALUE)
                            .addComponent(jLabel2)
                            .addComponent(tfInput)))
                    .addGroup(layout.createSequentialGroup()
                        .addGap(104, 104, 104)
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                                    .addComponent(lS1, GroupLayout.Alignment.TRAILING, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(lS2, GroupLayout.Alignment.TRAILING, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(lS3, GroupLayout.Alignment.TRAILING, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(lS4, GroupLayout.Alignment.TRAILING, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                                .addGap(41, 41, 41))
                            .addComponent(bAccept))
                        .addGap(66, 66, 66)))
                .addGap(76, 76, 76))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addComponent(jLabel1)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jLabel2)
                .addPreferredGap(LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(tfInput, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                .addGap(60, 60, 60)
                .addComponent(bAccept)
                .addGap(75, 75, 75)
                .addComponent(lS1)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(lS2)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(lS3)
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(lS4)
                .addContainerGap(GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
            .addComponent(lList, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
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
            // Parse the input
            int[] symbols = KeypadModel.parseSymbols(tfInput.getText());
            
            // Create a keypad model
            KeypadModel keypad = new KeypadModel(symbols);
            
            // Determine the order of symbols
            int[] orderedSymbols = KeypadLogic.determineOrder(keypad);
            
            // Display the ordered symbols
            String[] imagePaths = new String[orderedSymbols.length];
            for (int i = 0; i < orderedSymbols.length; i++) {
                imagePaths[i] = KeypadLogic.getImagePath(orderedSymbols[i]);
            }
            
            // Set the icons for the labels
            lS1.setIcon(new ImageIcon(getClass().getResource(imagePaths[0])));
            lS2.setIcon(new ImageIcon(getClass().getResource(imagePaths[1])));
            lS3.setIcon(new ImageIcon(getClass().getResource(imagePaths[2])));
            lS4.setIcon(new ImageIcon(getClass().getResource(imagePaths[3])));
            
            // Clear the text from the labels
            lS1.setText("");
            lS2.setText("");
            lS3.setText("");
            lS4.setText("");
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}