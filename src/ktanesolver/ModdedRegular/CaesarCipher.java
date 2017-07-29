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
public class CaesarCipher extends javax.swing.JFrame {

    boolean vowel=false;
    int batC;
    int lastDigit;
    String[] lit,unlit;
    char[] serial;
    int offset;
    boolean car=false,nsa=false;
    int parC;
    char[] input, output;
    String result;
    public CaesarCipher(String[] l, String[] u, int b, char[] s, int p) {
        lit=l;
        unlit=u;
        batC=b;
        serial=s;
        parC=p;
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

        tfInput = new javax.swing.JTextField();
        jLabel1 = new javax.swing.JLabel();
        lResult = new javax.swing.JLabel();
        bAccept = new javax.swing.JButton();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        jLabel1.setText("Result:");

        bAccept.setText("OK");
        bAccept.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addGap(0, 144, Short.MAX_VALUE)
                        .addComponent(bAccept))
                    .addComponent(tfInput)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(jLabel1)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(lResult)
                        .addGap(0, 0, Short.MAX_VALUE)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(tfInput, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel1)
                    .addComponent(lResult))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 43, Short.MAX_VALUE)
                .addComponent(bAccept)
                .addContainerGap())
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        offset=0;
        car=false;
        nsa=false;
        result="";
        for(int i=serial.length-1;i>=0;i--){
            if(Character.isDigit(serial[i]))
            {
                lastDigit=Character.getNumericValue(serial[i]);
                break;
            }
        }
        for(int i=0;i<serial.length;i++){
            if(serial[i]=='A'||serial[i]=='E'||serial[i]=='I'||serial[i]=='O'||serial[i]=='U'){
                vowel=true;
                break;
            }
        }
        if(lit!=null){
        for (String lit1 : lit) {
            if (lit1.equals("CAR")) {
                car=true;
            }
            if (lit1.equals("NSA"))
                nsa=true;
        }
        }
        if(unlit!=null){
        for (String unlit1 : unlit) {
            if (unlit1.equals("CAR")) {
                car=true;
            }
        }
        }
        if(vowel)
            offset=offset-1;
        offset=offset+batC;
        if(lastDigit%2==0)
            offset=offset+1;
        if(car)
            offset=offset+1;
        if(parC>0&&nsa)
            offset=0;
        input=tfInput.getText().toUpperCase().toCharArray();
        output= new char[input.length];
        for(int i=0;i<input.length;i++){
            if(input[i]+offset>90)
                output[i]=(char) ((input[i]+offset)-26);
            if(input[i]+offset<65)
                output[i]=(char) ((input[i]+offset)+26);
            else
                output[i]=(char) (input[i]+offset);
        }
        for(int i=0;i<output.length;i++)
            result=result+output[i];
        lResult.setText(result);
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
            java.util.logging.Logger.getLogger(CaesarCipher.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(CaesarCipher.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(CaesarCipher.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(CaesarCipher.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                //new CaesarCipher().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel lResult;
    private javax.swing.JTextField tfInput;
    // End of variables declaration//GEN-END:variables
}