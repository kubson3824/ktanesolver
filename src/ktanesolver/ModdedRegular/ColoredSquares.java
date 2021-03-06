/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ktanesolver.ModdedRegular;

/**
 *
 * @author Kuba
 */
public class ColoredSquares extends javax.swing.JFrame {

    int amount;
    String group;
    public ColoredSquares() {
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
        sLit = new javax.swing.JSpinner();
        cbGroup = new javax.swing.JComboBox<>();
        jLabel1 = new javax.swing.JLabel();
        jLabel2 = new javax.swing.JLabel();
        jLabel3 = new javax.swing.JLabel();
        lResult = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        bAccept.setText("OK");
        bAccept.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        sLit.setModel(new javax.swing.SpinnerNumberModel(0, 0, 16, 1));

        cbGroup.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "Red", "Blue", "Green", "Yellow", "Magenta", "Row", "Column" }));

        jLabel1.setText("Amount of lit squares");

        jLabel2.setText("Last pressed group");

        jLabel3.setText("Click:");

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(jLabel1)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(sLit, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(jLabel2)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(cbGroup, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)))
                        .addGap(0, 0, Short.MAX_VALUE))
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addComponent(jLabel3)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(lResult)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(bAccept)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel1)
                    .addComponent(sLit, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel2)
                    .addComponent(cbGroup, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(bAccept)
                    .addComponent(jLabel3)
                    .addComponent(lResult))
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        pack();
        setLocationRelativeTo(null);
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        amount=Integer.parseInt(sLit.getValue().toString());
        group=cbGroup.getSelectedItem().toString().toLowerCase();
        switch(group){
            case "red":{
                switch(amount){
                    case 1:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 2:{
                        lResult.setText("Row");
                        break;
                    }
                    case 3:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 4:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 5:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 6:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 7:{
                        lResult.setText("Green");
                        break;
                    }
                    case 8:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 9:{
                        lResult.setText("Column");
                        break;
                    }
                    case 10:{
                        lResult.setText("Green");
                        break;
                    }
                    case 11:{
                        lResult.setText("Red");
                        break;
                    }
                    case 12:{
                        lResult.setText("Column");
                        break;
                    }
                    case 13:{
                        lResult.setText("Row");
                        break;
                    }
                    case 14:{
                        lResult.setText("Red");
                        break;
                    }
                    case 15:{
                        lResult.setText("Column");
                        break;
                    }
                }
                break;
            }
            case "blue":{
                switch(amount){
                    case 1:{
                        lResult.setText("Column");
                        break;
                    }
                    case 2:{
                        lResult.setText("Green");
                        break;
                    }
                    case 3:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 4:{
                        lResult.setText("Green");
                        break;
                    }
                    case 5:{
                        lResult.setText("Row");
                        break;
                    }
                    case 6:{
                        lResult.setText("Red");
                        break;
                    }
                    case 7:{
                        lResult.setText("Row");
                        break;
                    }
                    case 8:{
                        lResult.setText("Red");
                        break;
                    }
                    case 9:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 10:{
                        lResult.setText("Column");
                        break;
                    }
                    case 11:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 12:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 13:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 14:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 15:{
                        lResult.setText("Row");
                        break;
                    }
                }
                break;
            }
            case "green":{
                switch(amount){
                    case 1:{
                        lResult.setText("Red");
                        break;
                    }
                    case 2:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 3:{
                        lResult.setText("Green");
                        break;
                    }
                    case 4:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 5:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 6:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 7:{
                        lResult.setText("Column");
                        break;
                    }
                    case 8:{
                        lResult.setText("Green");
                        break;
                    }
                    case 9:{
                        lResult.setText("Red");
                        break;
                    }
                    case 10:{
                        lResult.setText("Row");
                        break;
                    }
                    case 11:{
                        lResult.setText("Row");
                        break;
                    }
                    case 12:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 13:{
                        lResult.setText("Column");
                        break;
                    }
                    case 14:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 15:{
                        lResult.setText("Column");
                        break;
                    }
                }
                break;
            }
            case "yellow":{
                switch(amount){
                    case 1:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 2:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 3:{
                        lResult.setText("Row");
                        break;
                    }
                    case 4:{
                        lResult.setText("Column");
                        break;
                    }
                    case 5:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 6:{
                        lResult.setText("Green");
                        break;
                    }
                    case 7:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 8:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 9:{
                        lResult.setText("Green");
                        break;
                    }
                    case 10:{
                        lResult.setText("Red");
                        break;
                    }
                    case 11:{
                        lResult.setText("Column");
                        break;
                    }
                    case 12:{
                        lResult.setText("Red");
                        break;
                    }
                    case 13:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 14:{
                        lResult.setText("Row");
                        break;
                    }
                    case 15:{
                        lResult.setText("Row");
                        break;
                    }
                }
                break;
            }
            case "magenta":{
                switch(amount){
                    case 1:{
                        lResult.setText("Row");
                        break;
                    }
                    case 2:{
                        lResult.setText("Red");
                        break;
                    }
                    case 3:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 4:{
                        lResult.setText("Red");
                        break;
                    }
                    case 5:{
                        lResult.setText("Column");
                        break;
                    }
                    case 6:{
                        lResult.setText("Column");
                        break;
                    }
                    case 7:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 8:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 9:{
                        lResult.setText("Row");
                        break;
                    }
                    case 10:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 11:{
                        lResult.setText("Green");
                        break;
                    }
                    case 12:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 13:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 14:{
                        lResult.setText("Green");
                        break;
                    }
                    case 15:{
                        lResult.setText("Column");
                        break;
                    }
                }
                break;
            }
            case "row":{
                switch(amount){
                    case 1:{
                        lResult.setText("Green");
                        break;
                    }
                    case 2:{
                        lResult.setText("Column");
                        break;
                    }
                    case 3:{
                        lResult.setText("Red");
                        break;
                    }
                    case 4:{
                        lResult.setText("Row");
                        break;
                    }
                    case 5:{
                        lResult.setText("Red");
                        break;
                    }
                    case 6:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 7:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 8:{
                        lResult.setText("Column");
                        break;
                    }
                    case 9:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 10:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 11:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 12:{
                        lResult.setText("Row");
                        break;
                    }
                    case 13:{
                        lResult.setText("Green");
                        break;
                    }
                    case 14:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 15:{
                        lResult.setText("Row");
                        break;
                    }
                }
                break;
            }
            case "column":{
                switch(amount){
                    case 1:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 2:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 3:{
                        lResult.setText("Column");
                        break;
                    }
                    case 4:{
                        lResult.setText("Magenta");
                        break;
                    }
                    case 5:{
                        lResult.setText("Green");
                        break;
                    }
                    case 6:{
                        lResult.setText("Row");
                        break;
                    }
                    case 7:{
                        lResult.setText("Red");
                        break;
                    }
                    case 8:{
                        lResult.setText("Row");
                        break;
                    }
                    case 9:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 10:{
                        lResult.setText("Yellow");
                        break;
                    }
                    case 11:{
                        lResult.setText("Blue");
                        break;
                    }
                    case 12:{
                        lResult.setText("Green");
                        break;
                    }
                    case 13:{
                        lResult.setText("Red");
                        break;
                    }
                    case 14:{
                        lResult.setText("Column");
                        break;
                    }
                    case 15:{
                        lResult.setText("Column");
                        break;
                    }
                }
                break;
            }
        }
    }//GEN-LAST:event_bAcceptActionPerformed

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
            java.util.logging.Logger.getLogger(ColoredSquares.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(ColoredSquares.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(ColoredSquares.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(ColoredSquares.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new ColoredSquares().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JComboBox<String> cbGroup;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel lResult;
    private javax.swing.JSpinner sLit;
    // End of variables declaration//GEN-END:variables
}
