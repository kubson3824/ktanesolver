/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ktanesolver.ModdedRegular;

/**
 *
 * @author Komp
 */
public class BlindAlley extends javax.swing.JFrame {
    class Region{
        int count=0;
        String place;
        Region(int n){
            switch(n){
                case 0:{
                    place="Top left";
                    break;
                }
                case 1:{
                    place="Top middle";
                    break;
                }
                case 2:{
                    place="Middle left";
                    break;
                }
                case 3:{
                    place="Middle middle";
                    break;
                }
                case 4:{
                    place="Middle right";
                    break;
                }
                case 5:{
                    place="Bottom left";
                    break;
                }
                case 6:{
                    place="Bottom middle";
                    break;
                }
                case 7:{
                    place="Bottom right";
                    break;
                }
            }
        }        
    }
    Region[] regions;
    int portDVI, portParallel, portSerial, portRJ45, portPS2, portStereo;
    String[] lit,unlit;
    int bat,batHold;
    char[] serial;
    public BlindAlley(int pD, int pPar, int pSer, int pR, int pPS, int pSte, String[] l, int b, String[] u, int bH, char[] s) {
        portDVI=pD;
        portParallel=pPar;
        portSerial=pSer;
        portRJ45=pR;
        portPS2=pPS;
        portStereo=pSte;
        lit=l;
        unlit=u;
        bat=b;
        batHold=bH;
        serial=s;
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
        tfTL = new javax.swing.JTextField();
        tfTM = new javax.swing.JTextField();
        tfML = new javax.swing.JTextField();
        tfMM = new javax.swing.JTextField();
        tfMR = new javax.swing.JTextField();
        tfBL = new javax.swing.JTextField();
        tfBM = new javax.swing.JTextField();
        tfBR = new javax.swing.JTextField();
        jLabel1 = new javax.swing.JLabel();
        jLabel2 = new javax.swing.JLabel();
        jLabel3 = new javax.swing.JLabel();
        jLabel4 = new javax.swing.JLabel();
        jLabel5 = new javax.swing.JLabel();
        jLabel6 = new javax.swing.JLabel();
        jLabel7 = new javax.swing.JLabel();
        jLabel8 = new javax.swing.JLabel();
        jLabel9 = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        bAccept.setText("OK");
        bAccept.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        tfTL.setEditable(false);

        tfTM.setEditable(false);

        tfML.setEditable(false);

        tfMM.setEditable(false);

        tfMR.setEditable(false);

        tfBL.setEditable(false);

        tfBM.setEditable(false);

        tfBR.setEditable(false);

        jLabel1.setText("Click the region that has the highest value in it");

        jLabel2.setText("Top left");

        jLabel3.setText("Top middle");

        jLabel4.setText("Middle left");

        jLabel5.setText("Middle middle");

        jLabel6.setText("Middle right");

        jLabel7.setText("Bottom left");

        jLabel8.setText("Bottom middle");

        jLabel9.setText("Bottom right");

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                            .addGroup(layout.createSequentialGroup()
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel2, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfTL))
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel3, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfTM))
                                .addGap(97, 97, 97))
                            .addGroup(layout.createSequentialGroup()
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel7, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfBL))
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel8, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfBM))
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel9, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfBR))))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(bAccept))
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addComponent(jLabel1)
                            .addGroup(layout.createSequentialGroup()
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel4, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfML))
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel5, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfMM))
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                                    .addComponent(jLabel6, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                    .addComponent(tfMR))))
                        .addGap(0, 0, Short.MAX_VALUE)))
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabel1)
                .addGap(18, 18, 18)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                            .addComponent(jLabel2)
                            .addComponent(jLabel3))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                            .addComponent(tfTL, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                            .addComponent(tfTM, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)))
                    .addComponent(bAccept))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel4)
                    .addComponent(jLabel5)
                    .addComponent(jLabel6))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(tfML, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfMM, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfMR, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel7)
                    .addComponent(jLabel8)
                    .addComponent(jLabel9))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(tfBL, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfBM, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfBR, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        regions=new Region[8];
        for(int i=0;i<8;i++)
            regions[i]=new Region(i);
        if(lit!=null){
        for (String lit1 : lit) {
            if (lit1.equals("CAR")) {
                regions[0].count++;
            }
            if (lit1.equals("IND")) {
                regions[0].count++;
            }
            if (lit1.equals("FRK")) {
                regions[1].count++;
            }
            if (lit1.equals("NSA")) {
                regions[3].count++;
            }
            if (lit1.equals("BOB")) {
                regions[4].count++;
            }
            if (lit1.equals("CLR")) {
                regions[4].count++;
            }
            if (lit1.equals("FRQ")) {
                regions[5].count++;
            }
            if (lit1.equals("SIG")) {
                regions[5].count++;
            }
            if (lit1.equals("TRN")) {
                regions[5].count++;
            }
            if (lit1.equals("MSA")) {
                regions[6].count++;
            }
            if (lit1.equals("SND")) {
                regions[7].count++;
            }
        }
        }
        if(unlit!=null){
        for (String unlit1 : unlit) {
            if (unlit1.equals("BOB")) {
                regions[0].count++;
            }
            if (unlit1.equals("CAR")) {
                regions[1].count++;
            }
            if (unlit1.equals("NSA")) {
                regions[1].count++;
            }
            if (unlit1.equals("FRQ")) {
                regions[2].count++;
            }
            if (unlit1.equals("IND")) {
                regions[2].count++;
            }
            if (unlit1.equals("TRN")) {
                regions[2].count++;
            }
            if (unlit1.equals("SIG")) {
                regions[3].count++;
            }
            if (unlit1.equals("SND")) {
                regions[3].count++;
            }
            if (unlit1.equals("FRK")) {
                regions[6].count++;
            }
            if (unlit1.equals("CLR")) {
                regions[7].count++;
            }
            if (unlit1.equals("MSA")) {
                regions[7].count++;
            }
        }
        }
        if(batHold%2==0)
            regions[0].count++;
        if(portRJ45>0)
            regions[1].count++;
        if(portDVI>0)
            regions[2].count++;
        if(bat%2==0)
            regions[3].count++;
        if(portPS2>0)
            regions[4].count++;
        if(portSerial>0)
            regions[4].count++;
        for(int i=0;i<serial.length;i++){
            if(Character.isDigit(serial[i])){
                if(Integer.parseInt(Character.toString(serial[i]))%2==0){
                    regions[5].count++;
                    break;
                }
            }
        }
        if(portParallel>0)
            regions[6].count++;
        for(int i=0;i<serial.length;i++){
            if(Character.isLetter(serial[i])){
                if(serial[i]=='A'||serial[i]=='E'||serial[i]=='I'||serial[i]=='O'||serial[i]=='U'){
                    regions[6].count++;
                    break;
                }
            }
        }
        if(portStereo>0)
            regions[7].count++;
        tfTL.setText(String.valueOf(regions[0].count));
        tfTM.setText(String.valueOf(regions[1].count));
        tfML.setText(String.valueOf(regions[2].count));
        tfMM.setText(String.valueOf(regions[3].count));
        tfMR.setText(String.valueOf(regions[4].count));
        tfBL.setText(String.valueOf(regions[5].count));
        tfBM.setText(String.valueOf(regions[6].count));
        tfBR.setText(String.valueOf(regions[7].count));
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
            java.util.logging.Logger.getLogger(BlindAlley.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(BlindAlley.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(BlindAlley.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(BlindAlley.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                //new BlindAlley().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JLabel jLabel5;
    private javax.swing.JLabel jLabel6;
    private javax.swing.JLabel jLabel7;
    private javax.swing.JLabel jLabel8;
    private javax.swing.JLabel jLabel9;
    private javax.swing.JTextField tfBL;
    private javax.swing.JTextField tfBM;
    private javax.swing.JTextField tfBR;
    private javax.swing.JTextField tfML;
    private javax.swing.JTextField tfMM;
    private javax.swing.JTextField tfMR;
    private javax.swing.JTextField tfTL;
    private javax.swing.JTextField tfTM;
    // End of variables declaration//GEN-END:variables
}