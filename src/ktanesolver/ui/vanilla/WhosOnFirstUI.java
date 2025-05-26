package ktanesolver.ui.vanilla;

import javax.swing.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import ktanesolver.model.vanilla.WhosOnFirstModel;
import ktanesolver.logic.vanilla.WhosFirstLogic;

/**
 * UI class for the Who's First module.
 */
public class WhosOnFirstUI extends JFrame {
    private JComboBox<String> cbUP;
    private JComboBox<String> cbUpLeft;
    private JComboBox<String> cbUpRight;
    private JComboBox<String> cbMidLeft;
    private JComboBox<String> cbMidRight;
    private JComboBox<String> cbBotLeft;
    private JComboBox<String> cbBotRight;
    private JButton bAccept;
    private JLabel lResult;
    private JLabel jLabel2;
    
    private WhosOnFirstModel model;
    
    /**
     * Constructor
     */
    public WhosOnFirstUI() {
        model = new WhosOnFirstModel();
        initComponents();
    }
    
    /**
     * Initialize the UI components
     */
    private void initComponents() {
        cbUP = new JComboBox<>();
        cbUpLeft = new JComboBox<>();
        cbUpRight = new JComboBox<>();
        cbMidLeft = new JComboBox<>();
        cbMidRight = new JComboBox<>();
        cbBotLeft = new JComboBox<>();
        cbBotRight = new JComboBox<>();
        bAccept = new JButton();
        lResult = new JLabel();
        jLabel2 = new JLabel();

        setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Who's First");

        cbUP.setModel(new DefaultComboBoxModel<>(new String[] { "YES", "FIRST", "DISPLAY", "OKAY", "SAYS", "NOTHING", "", "BLANK", "NO", "LED", "LEAD", "READ", "RED", "REED", "LEED", "HOLD ON", "YOU", "YOU ARE", "YOUR", "YOU'RE", "UR", "THERE", "THEY'RE", "THEIR", "THEY ARE", "SEE", "C", "CEE" }));

        cbUpLeft.setModel(new DefaultComboBoxModel<>(new String[] { "READY", "FIRST", "NO", "BLANK", "NOTHING", "YES", "WHAT", "UHHH", "LEFT", "RIGHT", "MIDDLE", "OKAY", "WAIT", "PRESS", "YOU", "YOU ARE", "YOUR", "YOU'RE", "UR", "U", "UH HUH", "UH UH", "WHAT?", "DONE", "NEXT", "HOLD", "SURE", "LIKE" }));

        cbUpRight.setModel(new DefaultComboBoxModel<>(new String[] { "READY", "FIRST", "NO", "BLANK", "NOTHING", "YES", "WHAT", "UHHH", "LEFT", "RIGHT", "MIDDLE", "OKAY", "WAIT", "PRESS", "YOU", "YOU ARE", "YOUR", "YOU'RE", "UR", "U", "UH HUH", "UH UH", "WHAT?", "DONE", "NEXT", "HOLD", "SURE", "LIKE" }));

        cbMidLeft.setModel(new DefaultComboBoxModel<>(new String[] { "READY", "FIRST", "NO", "BLANK", "NOTHING", "YES", "WHAT", "UHHH", "LEFT", "RIGHT", "MIDDLE", "OKAY", "WAIT", "PRESS", "YOU", "YOU ARE", "YOUR", "YOU'RE", "UR", "U", "UH HUH", "UH UH", "WHAT?", "DONE", "NEXT", "HOLD", "SURE", "LIKE" }));

        cbMidRight.setModel(new DefaultComboBoxModel<>(new String[] { "READY", "FIRST", "NO", "BLANK", "NOTHING", "YES", "WHAT", "UHHH", "LEFT", "RIGHT", "MIDDLE", "OKAY", "WAIT", "PRESS", "YOU", "YOU ARE", "YOUR", "YOU'RE", "UR", "U", "UH HUH", "UH UH", "WHAT?", "DONE", "NEXT", "HOLD", "SURE", "LIKE" }));

        cbBotLeft.setModel(new DefaultComboBoxModel<>(new String[] { "READY", "FIRST", "NO", "BLANK", "NOTHING", "YES", "WHAT", "UHHH", "LEFT", "RIGHT", "MIDDLE", "OKAY", "WAIT", "PRESS", "YOU", "YOU ARE", "YOUR", "YOU'RE", "UR", "U", "UH HUH", "UH UH", "WHAT?", "DONE", "NEXT", "HOLD", "SURE", "LIKE" }));

        cbBotRight.setModel(new DefaultComboBoxModel<>(new String[] { "READY", "FIRST", "NO", "BLANK", "NOTHING", "YES", "WHAT", "UHHH", "LEFT", "RIGHT", "MIDDLE", "OKAY", "WAIT", "PRESS", "YOU", "YOU ARE", "YOUR", "YOU'RE", "UR", "U", "UH HUH", "UH UH", "WHAT?", "DONE", "NEXT", "HOLD", "SURE", "LIKE" }));

        bAccept.setText("OK");
        bAccept.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        jLabel2.setText("Result:");

        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addGap(56, 56, 56)
                                .addComponent(cbUP, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(cbMidLeft, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                .addGap(59, 59, 59)
                                .addComponent(cbMidRight, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(cbUpLeft, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                .addGap(59, 59, 59)
                                .addComponent(cbUpRight, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(cbBotLeft, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                                .addGap(59, 59, 59)
                                .addComponent(cbBotRight, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)))
                        .addGap(0, 0, Short.MAX_VALUE))
                    .addGroup(GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addComponent(jLabel2)
                        .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(lResult)
                        .addGap(18, 18, 18)
                        .addComponent(bAccept)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(cbUP, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbUpLeft, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(cbUpRight, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbMidLeft, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(cbMidRight, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(cbBotLeft, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE)
                    .addComponent(cbBotRight, GroupLayout.PREFERRED_SIZE, GroupLayout.DEFAULT_SIZE, GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(LayoutStyle.ComponentPlacement.RELATED, 28, Short.MAX_VALUE)
                .addGroup(layout.createParallelGroup(GroupLayout.Alignment.BASELINE)
                    .addComponent(bAccept)
                    .addComponent(lResult)
                    .addComponent(jLabel2))
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
            // Set the display and words in the model
            model.setDisplay(cbUP.getSelectedItem().toString());
            
            String[] words = new String[6];
            words[0] = cbUpLeft.getSelectedItem().toString();
            words[1] = cbUpRight.getSelectedItem().toString();
            words[2] = cbMidLeft.getSelectedItem().toString();
            words[3] = cbMidRight.getSelectedItem().toString();
            words[4] = cbBotLeft.getSelectedItem().toString();
            words[5] = cbBotRight.getSelectedItem().toString();
            model.setWords(words);
            
            // Process the Who's First module
            WhosFirstLogic.processWhosFirst(model);
            
            // Display the result
            lResult.setText(model.getResult());
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}