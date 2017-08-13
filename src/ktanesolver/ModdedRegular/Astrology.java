/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ktanesolver.ModdedRegular;

import javax.swing.JOptionPane;

/**
 *
 * @author Komp
 */
public class Astrology extends javax.swing.JFrame {

    class Symbol{
        String name;
        int number;
        boolean contains=false;
        Symbol(int n){
            switch(n){
                case 1:{
                    name="fire";
                    number=n;
                    break;
                }
                case 2:{
                    name="water";
                    number=n;
                    break;
                }
                case 3:{
                    name="earth";
                    number=n;
                    break;
                }
                case 4:{
                    name="air";
                    number=n;
                    break;
                }
                case 5:{
                    name="sun";
                    number=n;
                    break;
                }
                case 6:{
                    name="moon";
                    number=n;
                    break;
                }
                case 7:{
                    name="mercury";
                    number=n;
                    break;
                }
                case 8:{
                    name="venus";
                    number=n;
                    break;
                }
                case 9:{
                    name="mars";
                    number=n;
                    break;
                }
                case 10:{
                    name="jupiter";
                    number=n;
                    break;
                }
                case 11:{
                    name="saturn";
                    number=n;
                    break;
                }
                case 12:{
                    name="uranus";
                    number=n;
                    break;
                }
                case 13:{
                    name="neptune";
                    number=n;
                    break;
                }
                case 14:{
                    name="pluto";
                    number=n;
                    break;
                }
                case 15:{
                    name="aries";
                    number=n;
                    break;
                }
                case 16:{
                    name="taurus";
                    number=n;
                    break;
                }
                case 17:{
                    name="gemini";
                    number=n;
                    break;
                }
                case 18:{
                    name="cancer";
                    number=n;
                    break;
                }
                case 19:{
                    name="leo";
                    number=n;
                    break;
                }
                case 20:{
                    name="virgo";
                    number=n;
                    break;
                }
                case 21:{
                    name="libra";
                    number=n;
                    break;
                }
                case 22:{
                    name="scorpio";
                    number=n;
                    break;
                }
                case 23:{
                    name="sagittarius";
                    number=n;
                    break;
                }
                case 24:{
                    name="capricorn";
                    number=n;
                    break;
                }
                case 25:{
                    name="aquarius";
                    number=n;
                    break;
                }
                case 26:{
                    name="pisces";
                    number=n;
                    break;
                }
            }
        }
    }
    int result;
    Symbol[] symbols;
    String[] input;
    int lettersA;
    char[] serial;
    String[] letters;
    public Astrology(char[] s) {
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

        jLabel1 = new javax.swing.JLabel();
        bAccept = new javax.swing.JButton();
        tfInput = new javax.swing.JTextField();
        jLabel3 = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        jLabel1.setIcon(new javax.swing.ImageIcon(getClass().getResource("/KTANEResources/Astrology.jpg"))); // NOI18N

        bAccept.setText("OK");
        bAccept.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        jLabel3.setHorizontalAlignment(javax.swing.SwingConstants.CENTER);
        jLabel3.setText("Enter your symbols (from left to right)");

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addComponent(jLabel1)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel3, javax.swing.GroupLayout.DEFAULT_SIZE, 345, Short.MAX_VALUE)
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                                .addGap(0, 0, Short.MAX_VALUE)
                                .addComponent(bAccept))
                            .addComponent(tfInput, javax.swing.GroupLayout.Alignment.TRAILING))
                        .addContainerGap())))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addComponent(jLabel1)
                .addGap(0, 0, Short.MAX_VALUE))
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addGap(22, 22, 22)
                .addComponent(jLabel3)
                .addGap(18, 18, 18)
                .addComponent(tfInput, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(bAccept)
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        pack();
        setLocationRelativeTo(null);
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        result=0;
        lettersA=0;
        for(int i=0;i<serial.length;i++){
            if(Character.isLetter(serial[i]))
                lettersA++;
        }
        letters=new String[lettersA];
        int temp=0;
        for(int i=0;i<serial.length;i++){
            if(Character.isLetter(serial[i])){
                letters[temp]=String.valueOf(serial[i]);
                temp++;
            }   
        }
        input=tfInput.getText().split(" ");
        symbols= new Symbol[3];
        for(int i=0;i<3;i++){
            symbols[i]=new Symbol(Integer.parseInt(input[i]));
        }
        result=result+determ(symbols[0], symbols[1]);
        result=result+determ(symbols[0], symbols[2]);
        result=result+determ(symbols[1], symbols[2]);
        for(int i=0;i<symbols.length;i++){
            for(int j=0;j<letters.length;j++){
                if(symbols[i].name.toUpperCase().contains(letters[j])){
                    symbols[i].contains=true;
                    break;
                }
            }
        }
        for(int i=0;i<3;i++){
            if(symbols[i].contains==true)
                result++;
            else
                result--;
        }
        if(result>0){  
            JOptionPane.showMessageDialog(this, "Press GOOD OMEN when there is a "+result+" in the timer");
        }
        if(result<0){
            JOptionPane.showMessageDialog(this, "Press POOR OMEN when there is a "+(result-result-result)+" in the timer");
        }
        if(result==0){
            JOptionPane.showMessageDialog(this, "Press NO OMEN");
        }
    }//GEN-LAST:event_bAcceptActionPerformed
    private int determ(Symbol a, Symbol b){
        int res=0;
        switch(a.number){
            case 1:{
                switch(b.number){
                    case 5:{
                        res=0;
                        break;
                    }
                    case 6:{
                        res=0;
                        break;
                    }
                    case 7:{
                        res=1;
                        break;
                    }
                    case 8:{
                        res=-1;
                        break;
                    }
                    case 9:{
                        res=0;
                        break;
                    }
                    case 10:{
                        res=1;
                        break;
                    }
                    case 11:{
                        res=-2;
                        break;
                    }
                    case 12:{
                        res=2;
                        break;
                    }
                    case 13:{
                        res=0;
                        break;
                    }
                    case 14:{
                        res=-1;
                        break;
                    }
                    case 15:{
                        res=1;
                        break;
                    }
                    case 16:{
                        res=0;
                        break;
                    }
                    case 17:{
                        res=-1;
                        break;
                    }
                    case 18:{
                        res=0;
                        break;
                    }
                    case 19:{
                        res=0;
                        break;
                    }
                    case 20:{
                        res=2;
                        break;
                    }
                    case 21:{
                        res=2;
                        break;
                    }
                    case 22:{
                        res=0;
                        break;
                    }
                    case 23:{
                        res=1;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=1;
                        break;
                    }
                    case 26:{
                        res=0;
                        break;
                    }
                }
                break;
            }
            case 2:{
                switch(b.number){
                    case 5:{
                        res=-2;
                        break;
                    }
                    case 6:{
                        res=0;
                        break;
                    }
                    case 7:{
                        res=-1;
                        break;
                    }
                    case 8:{
                        res=0;
                        break;
                    }
                    case 9:{
                        res=2;
                        break;
                    }
                    case 10:{
                        res=0;
                        break;
                    }
                    case 11:{
                        res=-2;
                        break;
                    }
                    case 12:{
                        res=2;
                        break;
                    }
                    case 13:{
                        res=0;
                        break;
                    }
                    case 14:{
                        res=1;
                        break;
                    }
                    case 15:{
                        res=2;
                        break;
                    }
                    case 16:{
                        res=2;
                        break;
                    }
                    case 17:{
                        res=-1;
                        break;
                    }
                    case 18:{
                        res=2;
                        break;
                    }
                    case 19:{
                        res=-1;
                        break;
                    }
                    case 20:{
                        res=-1;
                        break;
                    }
                    case 21:{
                        res=-2;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=2;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=0;
                        break;
                    }
                    case 26:{
                        res=2;
                        break;
                    }
                }
                break;
            }
            case 3:{
                switch(b.number){
                    case 5:{
                        res=-1;
                        break;
                    }
                    case 6:{
                        res=-1;
                        break;
                    }
                    case 7:{
                        res=0;
                        break;
                    }
                    case 8:{
                        res=-1;
                        break;
                    }
                    case 9:{
                        res=1;
                        break;
                    }
                    case 10:{
                        res=2;
                        break;
                    }
                    case 11:{
                        res=0;
                        break;
                    }
                    case 12:{
                        res=2;
                        break;
                    }
                    case 13:{
                        res=1;
                        break;
                    }
                    case 14:{
                        res=-2;
                        break;
                    }
                    case 15:{
                        res=-2;
                        break;
                    }
                    case 16:{
                        res=-1;
                        break;
                    }
                    case 17:{
                        res=0;
                        break;
                    }
                    case 18:{
                        res=0;
                        break;
                    }
                    case 19:{
                        res=1;
                        break;
                    }
                    case 20:{
                        res=0;
                        break;
                    }
                    case 21:{
                        res=1;
                        break;
                    }
                    case 22:{
                        res=2;
                        break;
                    }
                    case 23:{
                        res=-1;
                        break;
                    }
                    case 24:{
                        res=-2;
                        break;
                    }
                    case 25:{
                        res=1;
                        break;
                    }
                    case 26:{
                        res=1;
                        break;
                    }
                }
                break;
            }
            case 4:{
                switch(b.number){
                    case 5:{
                        res=-1;
                        break;
                    }
                    case 6:{
                        res=2;
                        break;
                    }
                    case 7:{
                        res=-1;
                        break;
                    }
                    case 8:{
                        res=0;
                        break;
                    }
                    case 9:{
                        res=-2;
                        break;
                    }
                    case 10:{
                        res=-1;
                        break;
                    }
                    case 11:{
                        res=0;
                        break;
                    }
                    case 12:{
                        res=2;
                        break;
                    }
                    case 13:{
                        res=-2;
                        break;
                    }
                    case 14:{
                        res=2;
                        break;
                    }
                    case 15:{
                        res=1;
                        break;
                    }
                    case 16:{
                        res=1;
                        break;
                    }
                    case 17:{
                        res=-2;
                        break;
                    }
                    case 18:{
                        res=-2;
                        break;
                    }
                    case 19:{
                        res=2;
                        break;
                    }
                    case 20:{
                        res=0;
                        break;
                    }
                    case 21:{
                        res=-1;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=0;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=-1;
                        break;
                    }
                    case 26:{
                        res=-1;
                        break;
                    }
                }
                break;
            }
            case 5:{
                switch(b.number){
                    case 15:{
                        res=-1;
                        break;
                    }
                    case 16:{
                        res=-1;
                        break;
                    }
                    case 17:{
                        res=2;
                        break;
                    }
                    case 18:{
                        res=0;
                        break;
                    }
                    case 19:{
                        res=-1;
                        break;
                    }
                    case 20:{
                        res=0;
                        break;
                    }
                    case 21:{
                        res=-1;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=0;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=-2;
                        break;
                    }
                    case 26:{
                        res=-2;
                        break;
                    }
                }
                break;
            }
            case 6:{
                switch(b.number){
                    case 15:{
                        res=-2;
                        break;
                    }
                    case 16:{
                        res=0;
                        break;
                    }
                    case 17:{
                        res=1;
                        break;
                    }
                    case 18:{
                        res=0;
                        break;
                    }
                    case 19:{
                        res=2;
                        break;
                    }
                    case 20:{
                        res=0;
                        break;
                    }
                    case 21:{
                        res=-1;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=2;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=1;
                        break;
                    }
                    case 26:{
                        res=0;
                        break;
                    }
                }
                break;
            }
            case 7:{
                switch(b.number){
                    case 15:{
                        res=-2;
                        break;
                    }
                    case 16:{
                        res=-2;
                        break;
                    }
                    case 17:{
                        res=-1;
                        break;
                    }
                    case 18:{
                        res=-1;
                        break;
                    }
                    case 19:{
                        res=1;
                        break;
                    }
                    case 20:{
                        res=-1;
                        break;
                    }
                    case 21:{
                        res=0;
                        break;
                    }
                    case 22:{
                        res=-2;
                        break;
                    }
                    case 23:{
                        res=0;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=-1;
                        break;
                    }
                    case 26:{
                        res=1;
                        break;
                    }
                }
                break;
            }
            case 8:{
                switch(b.number){
                    case 15:{
                        res=-2;
                        break;
                    }
                    case 16:{
                        res=2;
                        break;
                    }
                    case 17:{
                        res=-2;
                        break;
                    }
                    case 18:{
                        res=0;
                        break;
                    }
                    case 19:{
                        res=0;
                        break;
                    }
                    case 20:{
                        res=1;
                        break;
                    }
                    case 21:{
                        res=-1;
                        break;
                    }
                    case 22:{
                        res=0;
                        break;
                    }
                    case 23:{
                        res=2;
                        break;
                    }
                    case 24:{
                        res=-2;
                        break;
                    }
                    case 25:{
                        res=-1;
                        break;
                    }
                    case 26:{
                        res=1;
                        break;
                    }
                }
                break;
            }
            case 9:{
                switch(b.number){
                    case 15:{
                        res=-2;
                        break;
                    }
                    case 16:{
                        res=0;
                        break;
                    }
                    case 17:{
                        res=-1;
                        break;
                    }
                    case 18:{
                        res=-2;
                        break;
                    }
                    case 19:{
                        res=-2;
                        break;
                    }
                    case 20:{
                        res=-2;
                        break;
                    }
                    case 21:{
                        res=-1;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=1;
                        break;
                    }
                    case 24:{
                        res=1;
                        break;
                    }
                    case 25:{
                        res=0;
                        break;
                    }
                    case 26:{
                        res=-1;
                        break;
                    }
                }
                break;
            }
            case 10:{
                switch(b.number){
                    case 15:{
                        res=-1;
                        break;
                    }
                    case 16:{
                        res=-2;
                        break;
                    }
                    case 17:{
                        res=1;
                        break;
                    }
                    case 18:{
                        res=-1;
                        break;
                    }
                    case 19:{
                        res=0;
                        break;
                    }
                    case 20:{
                        res=0;
                        break;
                    }
                    case 21:{
                        res=0;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=0;
                        break;
                    }
                    case 24:{
                        res=-1;
                        break;
                    }
                    case 25:{
                        res=2;
                        break;
                    }
                    case 26:{
                        res=0;
                        break;
                    }
                }
                break;
            }
            case 11:{
                switch(b.number){
                    case 15:{
                        res=-1;
                        break;
                    }
                    case 16:{
                        res=-1;
                        break;
                    }
                    case 17:{
                        res=0;
                        break;
                    }
                    case 18:{
                        res=0;
                        break;
                    }
                    case 19:{
                        res=1;
                        break;
                    }
                    case 20:{
                        res=1;
                        break;
                    }
                    case 21:{
                        res=0;
                        break;
                    }
                    case 22:{
                        res=0;
                        break;
                    }
                    case 23:{
                        res=0;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=-1;
                        break;
                    }
                    case 26:{
                        res=-1;
                        break;
                    }
                }
                break;
            }
            case 12:{
                switch(b.number){
                    case 15:{
                        res=-1;
                        break;
                    }
                    case 16:{
                        res=2;
                        break;
                    }
                    case 17:{
                        res=0;
                        break;
                    }
                    case 18:{
                        res=0;
                        break;
                    }
                    case 19:{
                        res=1;
                        break;
                    }
                    case 20:{
                        res=-2;
                        break;
                    }
                    case 21:{
                        res=1;
                        break;
                    }
                    case 22:{
                        res=0;
                        break;
                    }
                    case 23:{
                        res=2;
                        break;
                    }
                    case 24:{
                        res=-1;
                        break;
                    }
                    case 25:{
                        res=1;
                        break;
                    }
                    case 26:{
                        res=0;
                        break;
                    }
                }
                break;
            }
            case 13:{
                switch(b.number){
                    case 15:{
                        res=1;
                        break;
                    }
                    case 16:{
                        res=0;
                        break;
                    }
                    case 17:{
                        res=2;
                        break;
                    }
                    case 18:{
                        res=1;
                        break;
                    }
                    case 19:{
                        res=-1;
                        break;
                    }
                    case 20:{
                        res=1;
                        break;
                    }
                    case 21:{
                        res=1;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=0;
                        break;
                    }
                    case 24:{
                        res=-2;
                        break;
                    }
                    case 25:{
                        res=2;
                        break;
                    }
                    case 26:{
                        res=0;
                        break;
                    }
                }
                break;
            }
            case 14:{
                switch(b.number){
                    case 15:{
                        res=-1;
                        break;
                    }
                    case 16:{
                        res=0;
                        break;
                    }
                    case 17:{
                        res=0;
                        break;
                    }
                    case 18:{
                        res=-1;
                        break;
                    }
                    case 19:{
                        res=-2;
                        break;
                    }
                    case 20:{
                        res=1;
                        break;
                    }
                    case 21:{
                        res=2;
                        break;
                    }
                    case 22:{
                        res=1;
                        break;
                    }
                    case 23:{
                        res=1;
                        break;
                    }
                    case 24:{
                        res=0;
                        break;
                    }
                    case 25:{
                        res=0;
                        break;
                    }
                    case 26:{
                        res=-1;
                        break;
                    }
                }
                break;
            }
        }
        return res;
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
            java.util.logging.Logger.getLogger(Astrology.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(Astrology.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(Astrology.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(Astrology.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                //new Astrology().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JTextField tfInput;
    // End of variables declaration//GEN-END:variables
}
