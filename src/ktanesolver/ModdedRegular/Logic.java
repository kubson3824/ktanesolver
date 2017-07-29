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
public class Logic extends javax.swing.JFrame {
    
    int batC,indC,unlitIndA,portTypes,batHold,litA,portPar,portPS2,portSerial,portStereo,portRJ45,portDVI,portC;
    char[] serial;
    String[] litInd,unlitInd;
    boolean vowel, NOTPar1, NOTPar2, NOTPar3, NOTPar4, NOT1, NOT2, ind, frk, msa, unique, res1, res2;
    int letters,digits,lastDigit,sumOfDigits;
    Letter parOne,parTwo,parThree,parFour,one,two;
    char conPar1,conPar2,con1,con2;
    class Letter{
        boolean NOT;
        boolean result;
        String letter;
        Letter(boolean n, String l){
            NOT=n;
            letter=l;
            switch(letter){
                case "A":{
                    if(NOT){
                        if(batC==indC)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(batC==indC)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "B":{
                    if(NOT){
                        if(letters>digits)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(letters>digits)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "C":{
                    if(NOT){
                        if(ind)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(ind)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "D":{
                    if(NOT){
                        if(frk)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(frk)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "E":{
                    if(NOT){
                        if(unlitIndA==1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(unlitIndA==1)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "F":{
                    if(NOT){
                        if(portTypes>1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(portTypes>1)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "G":{
                    if(NOT){
                        if(batC>=2)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(batC>=2)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "H":{
                    if(NOT){
                        if(batC<2)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(batC<2)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "I":{
                    if(NOT){
                        if(lastDigit%2==1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(lastDigit%2==1)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "J":{
                    if(NOT){
                        if(batC>4)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(batC>4)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "K":{
                    if(NOT){
                        if(litA==1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(litA==1)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "L":{
                    if(NOT){
                        if(indC>2)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(indC>2)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "M":{
                    if(NOT){
                        if(unique)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(unique)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "N":{
                    if(NOT){
                        if(batHold>2)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(batHold>2)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "O":{
                    if(NOT){
                        if(litA>=1&&unlitIndA>=1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(litA>=1&&unlitIndA>=1)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "P":{
                    if(NOT){
                        if(portPar>=1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(batC==indC)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "Q":{
                    if(NOT){
                        if(portC==2)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(portC==2)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "R":{
                    if(NOT){
                        if(portPS2>0)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(portPS2>0)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "S":{
                    if(NOT){
                        if(sumOfDigits>10)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(sumOfDigits>10)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "T":{
                    if(NOT){
                        if(msa)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(msa)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "U":{
                    if(NOT){
                        if(batHold==1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(batHold==1)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "V":{
                    if(NOT){
                        if(vowel)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(vowel)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "W":{
                    if(NOT){
                        if(indC==0)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(indC==0)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "X":{
                    if(NOT){
                        if(indC==1)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(indC==1)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "Y":{
                    if(NOT){
                        if(portC>5)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(portC>5)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
                case "Z":{
                    if(NOT){
                        if(portC<2)
                            result=false;
                        else
                            result=true;
                    }
                    else{
                        if(portC<2)
                            result=true;
                        else
                            result=false;
                    }
                    break;
                }
            }
        }
    }
    public Logic(int b, int i, int pT, int uA, int bH, int lA, int pP, int pPS, int pS, String[] u, String[] l, char[] s, int pD, int pR, int pSt, int pC) {
        batC=b;
        indC=i;
        unlitIndA=uA;
        portTypes=pT;
        batHold=bH;
        litA=lA;
        portPar=pP;
        portPS2=pPS;
        portSerial=pS;
        portStereo=pSt;
        portRJ45=pR;
        portDVI=pD;
        serial=s;
        litInd=l;
        unlitInd=u;
        portC=pC;
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

        jLabel7 = new javax.swing.JLabel();
        tfPar1 = new javax.swing.JTextField();
        cbPar1 = new javax.swing.JComboBox<>();
        tfPar2 = new javax.swing.JTextField();
        jLabel1 = new javax.swing.JLabel();
        cb1 = new javax.swing.JComboBox<>();
        tf1 = new javax.swing.JTextField();
        lResult1 = new javax.swing.JLabel();
        checkNOTPar1 = new javax.swing.JCheckBox();
        checkNOTPar2 = new javax.swing.JCheckBox();
        checkNOT1 = new javax.swing.JCheckBox();
        jLabel8 = new javax.swing.JLabel();
        checkNOT2 = new javax.swing.JCheckBox();
        tfPar3 = new javax.swing.JTextField();
        cbPar2 = new javax.swing.JComboBox<>();
        tfPar4 = new javax.swing.JTextField();
        jLabel2 = new javax.swing.JLabel();
        cb2 = new javax.swing.JComboBox<>();
        tf2 = new javax.swing.JTextField();
        lResult2 = new javax.swing.JLabel();
        checkNOTPar3 = new javax.swing.JCheckBox();
        checkNOTPar4 = new javax.swing.JCheckBox();
        jButton1 = new javax.swing.JButton();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);
        setAutoRequestFocus(false);

        jLabel7.setText("(");

        cbPar1.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "∧", "∨", "⊻", "|", "↓", "↔", "→", "←" }));

        jLabel1.setText(")");

        cb1.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "∧", "∨", "⊻", "|", "↓", "↔", "→", "←" }));

        lResult1.setText("jLabel2");

        checkNOTPar1.setText("Red");

        checkNOTPar2.setText("Red");

        checkNOT1.setText("Red");

        jLabel8.setText("(");

        checkNOT2.setText("Red");

        cbPar2.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "∧", "∨", "⊻", "|", "↓", "↔", "→", "←" }));

        jLabel2.setText(")");

        cb2.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "∧", "∨", "⊻", "|", "↓", "↔", "→", "←" }));

        lResult2.setText("jLabel2");

        checkNOTPar3.setText("Red");

        checkNOTPar4.setText("Red");

        jButton1.setText("OK");
        jButton1.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jButton1ActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(jLabel7)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(tfPar1, javax.swing.GroupLayout.PREFERRED_SIZE, 50, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(cbPar1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addComponent(checkNOTPar1))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(tfPar2, javax.swing.GroupLayout.PREFERRED_SIZE, 50, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(jLabel1)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(cb1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addComponent(checkNOTPar2))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(checkNOT1)
                                .addGap(0, 0, Short.MAX_VALUE))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(tf1, javax.swing.GroupLayout.PREFERRED_SIZE, 50, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, 78, Short.MAX_VALUE)
                                .addComponent(lResult1))))
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(jLabel8)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(tfPar3, javax.swing.GroupLayout.PREFERRED_SIZE, 50, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(cbPar2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addComponent(checkNOTPar3))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(tfPar4, javax.swing.GroupLayout.PREFERRED_SIZE, 50, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(jLabel2)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(cb2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addComponent(checkNOTPar4))
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(checkNOT2)
                                .addGap(0, 0, Short.MAX_VALUE))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(tf2, javax.swing.GroupLayout.PREFERRED_SIZE, 50, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                .addComponent(lResult2))))
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addGap(0, 0, Short.MAX_VALUE)
                        .addComponent(jButton1)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addGap(16, 16, 16)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(checkNOTPar1)
                    .addComponent(checkNOTPar2)
                    .addComponent(checkNOT1))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel7)
                    .addComponent(tfPar1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(cbPar1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfPar2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel1)
                    .addComponent(cb1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(lResult1))
                .addGap(18, 18, 18)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(checkNOTPar3)
                    .addComponent(checkNOTPar4)
                    .addComponent(checkNOT2))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel8)
                    .addComponent(tfPar3, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(cbPar2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfPar4, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel2)
                    .addComponent(cb2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(lResult2))
                .addGap(18, 18, 18)
                .addComponent(jButton1)
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void jButton1ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jButton1ActionPerformed
        vowel=ind=frk=msa=unique=false;
        if((portPar==0||portPar==1)&&(portDVI==0||portDVI==1)&&(portPS2==0||portPS2==1)&&(portRJ45==0||portRJ45==1)&&(portSerial==0||portSerial==1)&&(portStereo==0||portStereo==1))
            unique=true;
        for(int i=0;i<serial.length;i++){
            if(serial[i]=='A'||serial[i]=='E'||serial[i]=='I'||serial[i]=='O'||serial[i]=='U'){
                vowel=true;
                break;
            }
        }
        if(litInd!=null){
            for (String litInd1 : litInd) {
                if (litInd1.equals("IND")) {
                    ind=true;
                    break;
                }
                if (litInd1.equals("FRK")) {
                    frk=true;
                    break;
                }
                if (litInd1.equals("MSA")) {
                    msa=true;
                    break;
                }
            }
        }
        if(unlitInd!=null){
            for (String unlitInd1 : unlitInd) {
                if (unlitInd1.equals("IND")) {
                    ind=true;
                    break;
                }
                if (unlitInd1.equals("FRK")) {
                    frk=true;
                    break;
                }
                if (unlitInd1.equals("MSA")) {
                    msa=true;
                    break;
                }
            }
        }
        sumOfDigits=0;
        lastDigit=0;
        digits=0;
        letters=0;
        for(int i=serial.length-1;i>=0;i--){
            if(Character.isDigit(serial[i]))
            {
                lastDigit=Character.getNumericValue(serial[i]);
                break;
            }
        }
        for(int i=serial.length-1;i>=0;i--){
            if(Character.isDigit(serial[i]))
            {
                digits++;
                sumOfDigits+=Integer.parseInt(Character.toString(serial[i]));
            }
        }
        letters=6-digits;
        conPar1=cbPar1.getSelectedItem().toString().charAt(0);
        conPar2=cbPar2.getSelectedItem().toString().charAt(0);
        con1=cb1.getSelectedItem().toString().charAt(0);
        con2=cb2.getSelectedItem().toString().charAt(0);
        NOTPar1=checkNOTPar1.isSelected();
        NOTPar2=checkNOTPar2.isSelected();
        NOTPar3=checkNOTPar3.isSelected();
        NOTPar4=checkNOTPar4.isSelected();
        NOT1=checkNOT1.isSelected();
        NOT2=checkNOT2.isSelected();
        parOne=new Letter(NOTPar1, tfPar1.getText().toUpperCase());
        parTwo=new Letter(NOTPar2, tfPar2.getText().toUpperCase());
        parThree=new Letter(NOTPar3, tfPar3.getText().toUpperCase());
        parFour=new Letter(NOTPar4, tfPar4.getText().toUpperCase());
        one=new Letter(NOT1, tf1.getText().toUpperCase());
        two=new Letter(NOT2, tf2.getText().toUpperCase());
        res1=decideResult(decideResult(parOne.result, parTwo.result, conPar1),one.result, con1);
        res2=decideResult(decideResult(parThree.result, parFour.result, conPar2),two.result, con2);
        if(res1)
            lResult1.setText("True");
        else
            lResult1.setText("False");
        if(res2)
            lResult2.setText("True");
        else
            lResult2.setText("False");
    }//GEN-LAST:event_jButton1ActionPerformed
    private boolean decideResult(boolean l, boolean r, char y){
        boolean result = false;
        switch(y){
            case '∧':{
                if(l==true&&r==true)
                    result=true;
                else
                    result=false;
                break;
            }
            case '∨':{
                if(l==false&&r==false)
                    result=false;
                else
                    result=true;
                break;
            }
            case '⊻':{
                if((l==true&&r==false)||(l==false&&r==true))
                    result=true;
                else
                    result=false;
                break;
            }
            case '|':{
                if(l==true&&r==true)
                    result=false;
                else
                    result=true;
                break;
            }
            case '↓':{
                if(l==false&&r==false)
                    result=true;
                else
                    result=false;
                break;
            }
            case '↔':{
                if((l==true&&r==false)||(l==false&&r==true))
                    result=false;
                else
                    result=true;
                break;
            }
            case '→':{
                if(l==true&&r==false)
                    result=false;
                else
                    result=true;
                break;
            }
            case '←':{
                if(l==false&&r==true)
                    result=false;
                else
                    result=true;
                break;
            }
        }
        return result;
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
            java.util.logging.Logger.getLogger(Logic.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(Logic.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(Logic.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(Logic.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                //new Logic().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JComboBox<String> cb1;
    private javax.swing.JComboBox<String> cb2;
    private javax.swing.JComboBox<String> cbPar1;
    private javax.swing.JComboBox<String> cbPar2;
    private javax.swing.JCheckBox checkNOT1;
    private javax.swing.JCheckBox checkNOT2;
    private javax.swing.JCheckBox checkNOTPar1;
    private javax.swing.JCheckBox checkNOTPar2;
    private javax.swing.JCheckBox checkNOTPar3;
    private javax.swing.JCheckBox checkNOTPar4;
    private javax.swing.JButton jButton1;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel7;
    private javax.swing.JLabel jLabel8;
    private javax.swing.JLabel lResult1;
    private javax.swing.JLabel lResult2;
    private javax.swing.JTextField tf1;
    private javax.swing.JTextField tf2;
    private javax.swing.JTextField tfPar1;
    private javax.swing.JTextField tfPar2;
    private javax.swing.JTextField tfPar3;
    private javax.swing.JTextField tfPar4;
    // End of variables declaration//GEN-END:variables
}
