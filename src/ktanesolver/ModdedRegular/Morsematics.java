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
public class Morsematics extends javax.swing.JFrame {
    class Pair{
        int number;
        String letter;
        String morse;
        public void update(){
            switch(number){
                case 1:{
                    morse=".-";
                    letter="A";
                    break;
                }
                case 2:{
                    morse="-...";
                    letter="B";
                    break;
                }
                case 3:{
                    morse="-.-.";
                    letter="C";
                    break;
                }
                case 4:{
                    morse="-..";
                    letter="D";
                    break;
                }
                case 5:{
                    morse=".";
                    letter="E";
                    break;
                }
                case 6:{
                    morse="..-.";
                    letter="F";
                    break;
                }
                case 7:{
                    morse="--.";
                    letter="G";
                    break;
                }
                case 8:{
                    morse="....";
                    letter="H";
                    break;
                }
                case 9:{
                    morse="..";
                    letter="I";
                    break;
                }
                case 10:{
                    morse=".---";
                    letter="J";
                    break;
                }
                case 11:{
                    morse="-.-";
                    letter="K";
                    break;
                }
                case 12:{
                    morse=".-..";
                    letter="L";
                    break;
                }
                case 13:{
                    morse="--";
                    letter="M";
                    break;
                }
                case 14:{
                    morse="-.";
                    letter="N";
                    break;
                }
                case 15:{
                    morse="---";
                    letter="O";
                    break;
                }
                case 16:{
                    morse=".--.";
                    letter="P";
                    break;
                }
                case 17:{
                    morse="--.-";
                    letter="Q";
                    break;
                }
                case 18:{
                    morse=".-.";
                    letter="R";
                    break;
                }
                case 19:{
                    morse="...";
                    letter="S";
                    break;
                }
                case 20:{
                    morse="-";
                    letter="T";
                    break;
                }
                case 21:{
                    morse="..-";
                    letter="U";
                    break;
                }
                case 22:{
                    morse="...-";
                    letter="V";
                    break;
                }
                case 23:{
                    morse=".--";
                    letter="W";
                    break;
                }
                case 24:{
                    morse="-..-";
                    letter="X";
                    break;
                }
                case 25:{
                    morse="-.--";
                    letter="Y";
                    break;
                }
                case 26:{
                    morse="--..";
                    letter="Z";
                    break;
                }
            }
            
        }  
        Pair(String l){
            switch(l){
                case "A":{
                    letter=l;
                    morse=".-";
                    number=1;
                    break;
                }
                case "B":{
                    letter=l;
                    morse="-...";
                    number=2;
                    break;
                }
                case "C":{
                    letter=l;
                    morse="-.-.";
                    number=3;
                    break;
                }
                case "D":{
                    letter=l;
                    morse="-..";
                    number=4;
                    break;
                }
                case "E":{
                    letter=l;
                    morse=".";
                    number=5;
                    break;
                }
                case "F":{
                    letter=l;
                    morse="..-.";
                    number=6;
                    break;
                }
                case "G":{
                    letter=l;
                    morse="--.";
                    number=7;
                    break;
                }
                case "H":{
                    letter=l;
                    morse="....";
                    number=8;
                    break;
                }
                case "I":{
                    letter=l;
                    morse="..";
                    number=9;
                    break;
                }
                case "J":{
                    letter=l;
                    morse=".---";
                    number=10;
                    break;
                }
                case "K":{
                    letter=l;
                    morse="-.-";
                    number=11;
                    break;
                }
                case "L":{
                    letter=l;
                    morse=".-..";
                    number=12;
                    break;
                }
                case "M":{
                    letter=l;
                    morse="--";
                    number=13;
                    break;
                }
                case "N":{
                    letter=l;
                    morse="-.";
                    number=14;
                    break;
                }
                case "O":{
                    letter=l;
                    morse="---";
                    number=15;
                    break;
                }
                case "P":{
                    letter=l;
                    morse=".--.";
                    number=16;
                    break;
                }
                case "Q":{
                    letter=l;
                    morse="--.-";
                    number=17;
                    break;
                }
                case "R":{
                    letter=l;
                    morse=".-.";
                    number=18;
                    break;
                }
                case "S":{
                    letter=l;
                    morse="...";
                    number=19;
                    break;
                }
                case "T":{
                    letter=l;
                    morse="-";
                    number=20;
                    break;
                }
                case "U":{
                    letter=l;
                    morse="..-";
                    number=21;
                    break;
                }
                case "V":{
                    letter=l;
                    morse="...-";
                    number=22;
                    break;
                }
                case "W":{
                    letter=l;
                    morse=".--";
                    number=23;
                    break;
                }
                case "X":{
                    letter=l;
                    morse="-..-";
                    number=24;
                    break;
                }
                case "Y":{
                    letter=l;
                    morse="-.--";
                    number=25;
                    break;
                }
                case "Z":{
                    letter=l;
                    morse="--..";
                    number=26;
                    break;
                }
            }
        }
        Pair(){
           number=0;
           letter=null;
           morse=null;
        }
    }
    class Letter{
        int number;
        boolean highest=false;
        String letter;
        String morse;
        Letter(String m){
            switch(m){
            case ".-":{
                number=1;
                letter="A";
                morse=m;
                break;
            }
            case "-...":{
                number=2;
                letter="B";
                morse=m;
                break;
            }
            case "-.-.":{
                number=3;
                letter="C";
                morse=m;
                break;
            }
            case "-..":{
                number=4;
                letter="D";
                morse=m;
                break;
            }
            case ".":{
                number=5;
                letter="E";
                morse=m;
                break;
            }
            case "..-.":{
                number=6;
                letter="F";
                morse=m;
                break;
            }
            case "--.":{
                number=7;
                letter="G";
                morse=m;
                break;
            }
            case "....":{
                number=8;
                letter="H";
                morse=m;
                break;
            }
            case "..":{
                number=9;
                letter="I";
                morse=m;
                break;
            }
            case ".---":{
                number=10;
                letter="J";
                morse=m;
                break;
            }
            case "-.-":{
                number=11;
                letter="K";
                morse=m;
                break;
            }
            case ".-..":{
                number=12;
                letter="L";
                morse=m;
                break;
            }
            case "--":{
                number=13;
                letter="M";
                morse=m;
                break;
            }
            case "-.":{
                number=14;
                letter="N";
                morse=m;
                break;
            }
            case "---":{
                number=15;
                letter="O";
                morse=m;
                break;
            }
            case ".--.":{
                number=16;
                letter="P";
                morse=m;
                break;
            }
            case "--.-":{
                number=17;
                letter="Q";
                morse=m;
                break;
            }
            case ".-.":{
                number=18;
                letter="R";
                morse=m;
                break;
            }
            case "...":{
                number=19;
                letter="S";
                morse=m;
                break;
            }
            case "-":{
                number=20;
                letter="T";
                morse=m;
                break;
            }
            case "..-":{
                number=21;
                letter="U";
                morse=m;
                break;
            }
            case "...-":{
                number=22;
                letter="V";
                morse=m;
                break;
            }
            case ".--":{
                number=23;
                letter="W";
                morse=m;
                break;
            }
            case "-..-":{
                number=24;
                letter="X";
                morse=m;
                break;
            }
            case "-.--":{
                number=25;
                letter="Y";
                morse=m;
                break;
            }
            case "--..":{
                number=26;
                letter="Z";
                morse=m;
                break;
            }
        }
        }
    }
    int batC,numb;
    Pair one,two,transmit;
    Letter first,second,third;
    String[] lit,unlit;
    char[] serial;
    public Morsematics(String[] l, String[] u, char[] s, int b) {
        lit=l;
        unlit=u;
        serial=s;
        batC=b;
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

        tfFirst = new javax.swing.JTextField();
        tfSecond = new javax.swing.JTextField();
        tfThree = new javax.swing.JTextField();
        bAccept = new javax.swing.JButton();
        jLabel1 = new javax.swing.JLabel();
        lResult = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        bAccept.setText("OK");
        bAccept.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        jLabel1.setText("Result:");

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(tfFirst, javax.swing.GroupLayout.PREFERRED_SIZE, 59, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(tfSecond, javax.swing.GroupLayout.PREFERRED_SIZE, 59, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(tfThree, javax.swing.GroupLayout.PREFERRED_SIZE, 59, javax.swing.GroupLayout.PREFERRED_SIZE))
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addComponent(jLabel1)
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
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(tfFirst, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfThree, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfSecond, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(bAccept)
                    .addComponent(jLabel1)
                    .addComponent(lResult))
                .addContainerGap(55, Short.MAX_VALUE))
        );

        tfSecond.getAccessibleContext().setAccessibleDescription("");

        pack();
        setLocationRelativeTo(null);
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        one=new Pair(String.valueOf(serial[3]));
        two=new Pair(String.valueOf(serial[4]));
        first=new Letter(tfFirst.getText());
        second=new Letter(tfSecond.getText());
        third=new Letter(tfThree.getText());
        if(lit!=null){
        for (String lit1 : lit) {
            if (lit1.contains(first.letter) || lit1.contains(second.letter) || lit1.contains(third.letter)) {
                one.number++;
                while(one.number>26)
                    one.number=one.number-26;
                while(one.number<1)
                    one.number=one.number+26;
            }
        }
        }
        if(unlit!=null){
        for (String unlit1 : unlit) {
            if (unlit1.contains(first.letter) || unlit1.contains(second.letter) || unlit1.contains(third.letter)) {
                two.number++;
                while(two.number>26)
                    two.number=two.number-26;
                while(two.number<1)
                    two.number=two.number+26;
            }
        }
        }
        if(one.number+two.number==4||one.number+two.number==9||one.number+two.number==16||one.number+two.number==25||one.number+two.number==36||one.number+two.number==49){
            one.number+=4;
            while(one.number>26)
                    one.number=one.number-26;
            while(one.number<1)
                    one.number=one.number+26;
        }
        else{
            two.number-=4;
            while(two.number>26)
                    two.number=two.number-26;
                while(two.number<1)
                    two.number=two.number+26;
        }
        if((first.number>=second.number)&&(first.number>=third.number))
            first.highest=true;
        if((second.number>=first.number)&&(second.number>=third.number))
            second.highest=true;
        if((third.number>=first.number)&&(third.number>=second.number))
            third.highest=true;
        if(first.highest)
            one.number+=first.number;
        if(second.highest)
            one.number+=second.number;
        if(third.highest)
            one.number+=third.number;
        while(one.number>26)
                    one.number=one.number-26;
        while(one.number<1)
                    one.number=one.number+26;
        if(isPrime(first.number))
            one.number-=first.number;
        if(isPrime(second.number))
            one.number-=second.number;
        if(isPrime(third.number))
            one.number-=third.number;
        while(one.number>26)
                    one.number=one.number-26;
        while(one.number<1)
                    one.number=one.number+26;
        if(first.number==4||first.number==9||first.number==16||first.number==25||first.number==36||first.number==49)
            two.number-=first.number;
        if(second.number==4||second.number==9||second.number==16||second.number==25||second.number==36||second.number==49)
            two.number-=second.number;
        if(third.number==4||third.number==9||third.number==16||third.number==25||third.number==36||third.number==49)
            two.number-=third.number;
        while(two.number>26)
                    two.number=two.number-26;
        while(two.number<1)
                    two.number=two.number+26;
        if(batC>0){
            if(first.number%batC==0){
                one.number-=first.number;
                two.number-=first.number;
            }
            if(second.number%batC==0){
                one.number-=second.number;
                two.number-=second.number;
            }
            if(third.number%batC==0){
                one.number-=third.number;
                two.number-=third.number;
            }
        }
        while(one.number>26)
                    one.number=one.number-26;
        while(one.number<1)
                    one.number=one.number+26;
        while(two.number>26)
                    two.number=two.number-26;
        while(two.number<1)
                    two.number=two.number+26;
        if(one.number==two.number)
            numb=one.number;
        if(one.number>two.number)
            numb=one.number-two.number;
        if(one.number<two.number)
            numb=one.number+two.number;
        while(numb>26)
                    numb=numb-26;
        while(numb<1)
                    numb=numb+26;
        transmit=new Pair();
        transmit.number=numb;
        transmit.update();
        lResult.setText(transmit.morse);
    }//GEN-LAST:event_bAcceptActionPerformed
    boolean isPrime(int n) {
    for(int i=2;i<n;i++) {
        if(n%i==0)
            return false;
    }
    return true;
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
            java.util.logging.Logger.getLogger(Morsematics.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(Morsematics.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(Morsematics.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(Morsematics.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                //new Morsematics().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel lResult;
    private javax.swing.JTextField tfFirst;
    private javax.swing.JTextField tfSecond;
    private javax.swing.JTextField tfThree;
    // End of variables declaration//GEN-END:variables
}
