/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ktanesolver.VanillaRegular;

import javax.swing.JOptionPane;

/**
 *
 * @author Komp
 */
public class Memory extends javax.swing.JFrame {

    int display,stage=0;
    int[] position, number;
    public Memory() {
        this.position = new int[4];
        this.number = new int[4];
        initComponents();
    }

    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        jButton1 = new javax.swing.JButton();
        sDisplay = new javax.swing.JSpinner();
        jLabel1 = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        jButton1.setText("OK");
        jButton1.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButton1ActionPerformed(evt);
            }
        });

        sDisplay.setModel(new javax.swing.SpinnerNumberModel(1, 1, 4, 1));

        jLabel1.setText("Number on the display");

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(sDisplay, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jLabel1)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(jButton1)
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jButton1)
                    .addComponent(sDisplay, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1))
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        pack();
        setLocationRelativeTo(null);
    }// </editor-fold>//GEN-END:initComponents

    private void jButton1ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButton1ActionPerformed
        if(stage==5){
            this.dispose();
        }
        else{
        stage++;
        display=Integer.parseInt(sDisplay.getValue().toString());
        valueDet();
        }
    }//GEN-LAST:event_jButton1ActionPerformed
    private void valueDet(){
        
        switch(stage){
            case 1:{
                switch(display){
                    case 1:{
                        position[0]=2;
                        number[0]=Integer.parseInt(JOptionPane.showInputDialog("Press the 2 button, what is the number on it?"));
                        break;
                    }
                    case 2:{
                        position[0]=2;
                        number[0]=Integer.parseInt(JOptionPane.showInputDialog("Press the 2 button, what is the number on it?"));
                        break;
                    }
                    case 3:{
                        position[0]=3;
                        number[0]=Integer.parseInt(JOptionPane.showInputDialog("Press the 3 button, what is the number on it?"));
                        break;
                    }
                    case 4:{
                        position[0]=4;
                        number[0]=Integer.parseInt(JOptionPane.showInputDialog("Press the 4 button, what is the number on it?"));
                        break;
                    }
                }
                break;
            }
            case 2:{
                switch(display){
                    case 1:{
                        number[1]=4;
                        position[1]=Integer.parseInt(JOptionPane.showInputDialog("Press the button labeled \"4\" button, what is the position of it?"));
                        break;
                    }
                    case 2:{
                        position[1]=position[0];
                        number[1]=Integer.parseInt(JOptionPane.showInputDialog("Press the "+position[1]+" button, what is the number on it?"));
                        break;
                    }
                    case 3:{
                        position[1]=1;
                        number[1]=Integer.parseInt(JOptionPane.showInputDialog("Press the 1 button, what is the number on it?"));
                        break;
                    }
                    case 4:{
                        position[1]=position[0];
                        number[1]=Integer.parseInt(JOptionPane.showInputDialog("Press the "+position[1]+" button, what is the number on it?"));
                        break;
                    }
                }
                break;
            }
            case 3:{
                switch(display){
                    case 1:{
                        number[2]=number[1];
                        position[2]=Integer.parseInt(JOptionPane.showInputDialog("Press the button labeled \""+number[2]+"\", what is the position of it?"));
                        break;
                    }
                    case 2:{
                        number[2]=number[0];
                        position[2]=Integer.parseInt(JOptionPane.showInputDialog("Press the button labeled \""+number[2]+"\", what is the position of it?"));
                        break;
                    }
                    case 3:{
                        position[2]=3;
                        number[2]=Integer.parseInt(JOptionPane.showInputDialog("Press the 3 button, what is the number on it?"));
                        break;
                    }
                    case 4:{
                        number[2]=4;
                        position[2]=Integer.parseInt(JOptionPane.showInputDialog("Press the button labeled \"4\", what is the position of it?"));
                        break;
                    }
                }
                break;
            }
            case 4:{
                switch(display){
                    case 1:{
                        position[3]=position[0];
                        number[3]=Integer.parseInt(JOptionPane.showInputDialog("Press the "+position[3]+" button, what is the number on it?"));
                        break;
                    }
                    case 2:{
                        position[3]=1;
                        number[3]=Integer.parseInt(JOptionPane.showInputDialog("Press the 1 button, what is the number on it?"));
                        break;
                    }
                    case 3:{
                        position[3]=position[1];
                        number[3]=Integer.parseInt(JOptionPane.showInputDialog("Press the "+position[3]+" button, what is the number on it?"));
                        break;
                    }
                    case 4:{
                        position[3]=position[1];
                        number[3]=Integer.parseInt(JOptionPane.showInputDialog("Press the "+position[3]+" button, what is the number on it?"));
                        break;
                    }
                }
                break;
            }
            case 5:{
                switch(display){
                    case 1:{
                        JOptionPane.showMessageDialog(this, "Press the button labeled \""+number[0]+"\"");
                        break;

                    }
                    case 2:{
                        JOptionPane.showMessageDialog(this, "Press the button labeled \""+number[1]+"\"");
                        break;

                    }
                    case 3:{
                        JOptionPane.showMessageDialog(this, "Press the button labeled \""+number[3]+"\"");
                        break;

                    }
                    case 4:{
                        JOptionPane.showMessageDialog(this, "Press the button labeled \""+number[2]+"\"");
                        break;

                    }
                }
            }
            break;
        }
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
            java.util.logging.Logger.getLogger(Memory.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(Memory.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(Memory.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(Memory.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new Memory().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton jButton1;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JSpinner sDisplay;
    // End of variables declaration//GEN-END:variables
}
