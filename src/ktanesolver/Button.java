/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ktanesolver;

import java.awt.HeadlessException;
import javax.swing.JOptionPane;

/**
 *
 * @author Komp
 */
public class Button extends javax.swing.JFrame {
    Menu menu;
    String colour,text;
    boolean frk=false, car=false;
    int bat;
    public Button(Menu m,int b, String[] l) {
        menu=m;
        bat=b;
        if(null==l){
        } else {
            for (String l1 : l) {
                if (l1.equals("FRK")) {
                    frk=true;
                }
                if (l1.equals("CAR")) {
                    car=true;
                }
            }
        }
        initComponents();
    }
    /**
     * This method is called from within the constructor to initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is always
     * regenerated by the Form Editor.
     */
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        bAccept = new javax.swing.JButton();
        jLabel1 = new javax.swing.JLabel();
        jLabel2 = new javax.swing.JLabel();
        cbColour = new javax.swing.JComboBox<>();
        cbText = new javax.swing.JComboBox<>();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Button");

        bAccept.setText("OK");
        bAccept.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        jLabel1.setText("Colour");

        jLabel2.setText("Text");

        cbColour.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "Red", "White", "Blue", "Yellow" }));

        cbText.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "Detonate", "Hold", "Press", "Abort" }));

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel1)
                    .addComponent(jLabel2))
                .addGap(18, 18, 18)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(cbText, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 24, Short.MAX_VALUE)
                        .addComponent(bAccept))
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(cbColour, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(0, 0, Short.MAX_VALUE)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel1)
                    .addComponent(cbColour, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 24, Short.MAX_VALUE)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel2)
                    .addComponent(cbText, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(bAccept))
                .addContainerGap())
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        colour=cbColour.getSelectedItem().toString().toLowerCase();
        text=cbText.getSelectedItem().toString().toLowerCase();
        
        if(colour.equals("blue")&&text.equals("abort"))
            holding();
        else{
            if(bat>1&&text.equals("detonate"))
                pushing();
            else{
                if(colour.equals("white")&&car)
                    holding();
                else{
                    if(bat>2&&frk)
                        pushing();
                    else{
                        if(colour.equals("yellow"))
                            holding();
                        else{
                            if(colour.equals("red")&&text.equals("hold"))
                                pushing();
                            else
                                holding();
                        }
                    }
                }
            }
        }
    }//GEN-LAST:event_bAcceptActionPerformed

    public void pushing() throws HeadlessException {
        JOptionPane.showMessageDialog(rootPane, "Press and immediately release");
    }

    public void holding() throws HeadlessException {
        ButtonStrip tempStrip = new ButtonStrip();
        tempStrip.setVisible(true);
    }

    /**
     * @param args the command line arguments
     */
    public static void main(String args[]) {
        /* Set the Nimbus look and feel */
        //<editor-fold defaultstate="collapsed" desc=" Look and feel setting code (optional) ">
        /* If Nimbus (introduced in Java SE 6) is not available, stay with the default look and feel.
         * For details see http://download.oracle.com/javase/tutorial/uiswing/lookandfeel/plaf.html 
         */
        try {
            for (javax.swing.UIManager.LookAndFeelInfo info : javax.swing.UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    javax.swing.UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (ClassNotFoundException ex) {
            java.util.logging.Logger.getLogger(Button.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(Button.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(Button.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(Button.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                //new Button().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JComboBox<String> cbColour;
    private javax.swing.JComboBox<String> cbText;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    // End of variables declaration//GEN-END:variables
}
