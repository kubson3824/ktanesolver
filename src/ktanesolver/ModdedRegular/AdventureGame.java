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
public class AdventureGame extends javax.swing.JFrame {
    Enemy enemy;
    Weapon[] weapons;
    Item[] items;
    int batC,portDVI,portPS2,portParallel,portRJ45,portSerial,portStereo,litInd,unlitInd,lastDig,firstDig;
    char[] serial;
    int feet,inches,temp,press,str,dex,INT;
    float fog;
    String useItem,useWeapon;
    String[] input;
    int wep1, wep2, wep3;
    class Enemy{
        String name;
        int STR,DEX,INT;

        public Enemy(String n) {
            switch(n){
                case "Demon":{
                    STR=50;
                    DEX=50;
                    INT=50;
                    name=n;
                    break;
                }
                case "Dragon":{
                    STR=10;
                    DEX=11;
                    INT=13;
                    name=n;
                    break;
                }
                case "Eagle":{
                    STR=4;
                    DEX=7;
                    INT=3;
                    name=n;
                    break;
                }
                case "Goblin":{
                    STR=3;
                    DEX=6;
                    INT=5;
                    name=n;
                    break;
                }
                case "Golem":{
                    STR=9;
                    DEX=4;
                    INT=7;
                    name=n;
                    break;
                }
                case "Troll":{
                    STR=8;
                    DEX=5;
                    INT=4;
                    name=n;
                    break;
                }
                case "Lizard":{
                    STR=4;
                    DEX=6;
                    INT=3;
                    name=n;
                    break;
                }
                case "Wizard":{
                    STR=4;
                    DEX=3;
                    INT=8;
                    name=n;
                    break;
                }
            }
        }
    }
    class Weapon{
        int bonus;
        boolean use=false;
        String name, stat;
        Weapon(String n){
            switch(n){
            case "broadsword":{
                stat="STR";
                bonus=0;
                name=n;
                break;
            }            
            case "caber":{
                stat="STR";
                bonus=2;
                name=n;
                break;
            }            
            case "nasty knife":{
                stat="DEX";
                bonus=0;
                name=n;
                break;
            }            
            case "longbow":{
                stat="DEX";
                bonus=2;
                name=n;
                break;
            }            
            case "magic orb":{
                stat="INT";
                bonus=0;
                name=n;
                break;
            }            
            case "grimoire":{
                stat="INT";
                bonus=2;
                name=n;
                break;
            }            
        }   
        }
    }
    class Item{
        String name;
        boolean use=false;
        Item(String i){
            switch(i){
            case "balloon":{
                name=i;
                break;
            }
            case "battery":{
                name=i;
                break;
            }
            case "bellows":{
                name=i;
                break;
            }
            case "cheat code":{
                name=i;
                break;
            }
            case "crystal ball":{
                name=i;
                break;
            }
            case "feather":{
                name=i;
                break;
            }
            case "hard drive":{
                name=i;
                break;
            }
            case "lamp":{
                name=i;
                break;
            }
            case "moonstone":{
                name=i;
                break;
            }
            case "potion":{
                name=i;
                break;
            }
            case "small dog":{
                name=i;
                break;
            }
            case "stepladder":{
                name=i;
                break;
            }
            case "sunstone":{
                name=i;
                break;
            }
            case "symbol":{
                name=i;
                break;
            }
            case "ticket":{
                name=i;
                break;
            }
            case "trophy":{
                name=i;
                break;
            }
            }
        }
    }
    public AdventureGame(int b,char[] s,int pd,int pps2, int pp, int prj, int ps, int pst, int l, int u) {
        litInd=l;
        unlitInd=u;
        portDVI=pd;
        portPS2=pps2;
        portParallel=pp;
        portRJ45=prj;
        portSerial=ps;
        portStereo=pst;
        serial=s;
        batC=b;
        initComponents();
    }
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        jLabel1 = new javax.swing.JLabel();
        tfFeet = new javax.swing.JTextField();
        jLabel2 = new javax.swing.JLabel();
        tfInches = new javax.swing.JTextField();
        jLabel3 = new javax.swing.JLabel();
        jLabel4 = new javax.swing.JLabel();
        jLabel5 = new javax.swing.JLabel();
        jLabel6 = new javax.swing.JLabel();
        jLabel7 = new javax.swing.JLabel();
        jLabel8 = new javax.swing.JLabel();
        jLabel9 = new javax.swing.JLabel();
        jLabel10 = new javax.swing.JLabel();
        tfTemp = new javax.swing.JTextField();
        tfFOG = new javax.swing.JTextField();
        tfPress = new javax.swing.JTextField();
        tfSTR = new javax.swing.JTextField();
        tfDEX = new javax.swing.JTextField();
        tfINT = new javax.swing.JTextField();
        tfItems = new javax.swing.JTextField();
        jLabel11 = new javax.swing.JLabel();
        jLabel13 = new javax.swing.JLabel();
        bAccept = new javax.swing.JButton();
        lUsedItems = new javax.swing.JLabel();
        lWeapon = new javax.swing.JLabel();
        jLabel15 = new javax.swing.JLabel();
        cbEnemy = new javax.swing.JComboBox<>();
        bPotion = new javax.swing.JButton();
        tfAmount = new javax.swing.JTextField();
        jLabel12 = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        jLabel1.setText("Height:");

        jLabel2.setFont(new java.awt.Font("Tahoma", 0, 14)); // NOI18N
        jLabel2.setText("'");

        jLabel3.setFont(new java.awt.Font("Tahoma", 0, 14)); // NOI18N
        jLabel3.setText("''");

        jLabel4.setText("Temperature:");

        jLabel5.setText("Force of gravity:");

        jLabel6.setText("Pressure:");

        jLabel7.setText("STR:");

        jLabel8.setText("DEX:");

        jLabel9.setText("INT:");

        jLabel10.setText("Items:");

        jLabel11.setText("Use:");

        jLabel13.setText("Weapon:");

        bAccept.setText("OK");
        bAccept.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bAcceptActionPerformed(evt);
            }
        });

        jLabel15.setText("Enemy:");

        cbEnemy.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "Demon", "Dragon", "Eagle", "Goblin", "Golem", "Troll", "Lizard", "Wizard" }));

        bPotion.setText("After potion");
        bPotion.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                bPotionActionPerformed(evt);
            }
        });

        jLabel12.setText("Amount of items");

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(jLabel13)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(lWeapon)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(bAccept))
                    .addGroup(layout.createSequentialGroup()
                        .addComponent(jLabel10)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(tfItems))
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(jLabel15)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(cbEnemy, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addGroup(layout.createSequentialGroup()
                                .addComponent(jLabel11)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(lUsedItems)))
                        .addGap(0, 381, Short.MAX_VALUE))
                    .addGroup(layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING, false)
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                                .addComponent(jLabel9)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfINT))
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                                .addComponent(jLabel8)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfDEX))
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                                .addComponent(jLabel7)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfSTR))
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                                .addComponent(jLabel6)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfPress))
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                                .addComponent(jLabel5)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfFOG))
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                                .addComponent(jLabel4)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfTemp))
                            .addGroup(javax.swing.GroupLayout.Alignment.LEADING, layout.createSequentialGroup()
                                .addComponent(jLabel1)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfFeet, javax.swing.GroupLayout.PREFERRED_SIZE, 56, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(jLabel2)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tfInches, javax.swing.GroupLayout.PREFERRED_SIZE, 56, javax.swing.GroupLayout.PREFERRED_SIZE)))
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                            .addGroup(layout.createSequentialGroup()
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(jLabel3)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                                .addComponent(jLabel12)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)))
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                            .addComponent(bPotion, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addComponent(tfAmount))))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel1)
                    .addComponent(tfFeet, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel2)
                    .addComponent(tfInches, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel3))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel4)
                    .addComponent(tfTemp, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tfAmount, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(jLabel12))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel5)
                    .addComponent(tfFOG, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(bPotion))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel6)
                    .addComponent(tfPress, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel7)
                    .addComponent(tfSTR, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel8)
                    .addComponent(tfDEX, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel9)
                    .addComponent(tfINT, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel15)
                    .addComponent(cbEnemy, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel10)
                    .addComponent(tfItems, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel11)
                    .addComponent(lUsedItems))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(bAccept, javax.swing.GroupLayout.Alignment.TRAILING)
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                            .addComponent(jLabel13)
                            .addComponent(lWeapon))
                        .addGap(0, 11, Short.MAX_VALUE)))
                .addContainerGap())
        );

        pack();
        setLocationRelativeTo(null);
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        useItem="";
        useWeapon="";
        feet=Integer.parseInt(tfFeet.getText());
        inches=Integer.parseInt(tfInches.getText());
        temp=Integer.parseInt(tfTemp.getText());
        press=Integer.parseInt(tfPress.getText());
        fog=Float.parseFloat(tfFOG.getText());
        str=Integer.parseInt(tfSTR.getText());
        dex=Integer.parseInt(tfDEX.getText());
        INT=Integer.parseInt(tfINT.getText());
        for(int i=serial.length-1;i>=0;i--){
            if(Character.isDigit(serial[i]))
            {
                lastDig=Character.getNumericValue(serial[i]);
                break;
            }
        }
        for(int i=0;i<=serial.length;i++){
            if(Character.isDigit(serial[i]))
            {
                firstDig=Character.getNumericValue(serial[i]);
                break;
            }
        }
        enemy=new Enemy(cbEnemy.getSelectedItem().toString());
        input=tfItems.getText().toLowerCase().split(", ");
        items=new Item[5];
        weapons=new Weapon[3];
        for(int i=0;i<3;i++)
            weapons[i]=new Weapon(input[i]);
        for(int i=0;i<5;i++)
            items[i]=new Item(input[i+3]);
        for(int i=0;i<5;i++)
            deterItems(items[i]);
        for(int i=0;i<5;i++){
            if(items[i].name.equals("potion"))
                JOptionPane.showMessageDialog(this, "Use the potion as last, re-enter your stats and the items that you have");
            if(items[i].use==true)
                useItem=useItem+" "+items[i].name;
        }
        lUsedItems.setText(useItem);
        wep1=calcWeapons(weapons[0],enemy);
        wep2=calcWeapons(weapons[1],enemy);
        wep3=calcWeapons(weapons[2],enemy);
        if(wep1>=wep2&&wep1>=wep3)
            useWeapon=useWeapon+" "+weapons[0].name;
        if(wep2>=wep1&&wep2>=wep3)
            useWeapon=useWeapon+" "+weapons[1].name;
        if(wep3>=wep1&&wep3>=wep2)
            useWeapon=useWeapon+" "+weapons[2].name;
        lWeapon.setText(useWeapon); 
    }//GEN-LAST:event_bAcceptActionPerformed

    private void bPotionActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bPotionActionPerformed
        useItem="";
        useWeapon="";
        str=Integer.parseInt(tfSTR.getText());
        dex=Integer.parseInt(tfDEX.getText());
        INT=Integer.parseInt(tfINT.getText());
        enemy=new Enemy(cbEnemy.getSelectedItem().toString());
        input=tfItems.getText().toLowerCase().split(", ");
        items=new Item[Integer.parseInt(tfAmount.getText())-3];
        for(int i=0;i<Integer.parseInt(tfAmount.getText())-3;i++)
            items[i]=new Item(input[i+3]);
        for(int i=0;i<Integer.parseInt(tfAmount.getText())-3;i++)
            deterItems(items[i]);
        for(int i=0;i<Integer.parseInt(tfAmount.getText())-3;i++){
            if(items[i].use==true)
                useItem=useItem+" "+items[i].name;
        }
        lUsedItems.setText(useItem);
        wep1=calcWeapons(weapons[0],enemy);
        wep2=calcWeapons(weapons[1],enemy);
        wep3=calcWeapons(weapons[2],enemy);
        if(wep1>=wep2&&wep1>=wep3)
            useWeapon=useWeapon+" "+weapons[0].name;
        if(wep2>=wep1&&wep2>=wep3)
            useWeapon=useWeapon+" "+weapons[1].name;
        if(wep3>=wep1&&wep3>=wep2)
            useWeapon=useWeapon+" "+weapons[2].name;
        lWeapon.setText(useWeapon); 
    }//GEN-LAST:event_bPotionActionPerformed

    private void deterItems(Item a){
        switch(a.name){
            case "balloon":{
                if((fog<9.3||press>110)&&!enemy.name.equals("Eagle")){
                    a.use=true;
                }
                break;
            }
            case "battery":{
                if(batC<=1&&(!enemy.name.equals("Golem")&&!enemy.name.equals("Wizard"))){
                    a.use=true;
                }
                break;
            }
            case "bellows":{
                if(enemy.name.equals("Dragon")||enemy.name.equals("Eagle")){
                    if(press>105){
                    a.use=true;
                    }
                }
                else{
                    if(press<95)
                        a.use=true;
                }
                break;
            }
            case "cheat code":{
                a.use=false;
                break;
            }
            case "crystal ball":{
                if(INT>lastDig&&!enemy.name.equals("Wizard")){
                    a.use=true;
                }
                break;
            }
            case "feather":{
                if(dex>str||dex>INT){
                    a.use=true;
                }
                break;
            }
            case "hard drive":{
                if(portDVI>=2||portPS2>=2||portParallel>=2||portRJ45>=2||portSerial>=2||portStereo>=2){
                    a.use=true;
                }
                break;
            }
            case "lamp":{
                if(temp<12&&!enemy.name.equals("Lizard")){
                    a.use=true;
                }
                break;
            }
            case "moonstone":{
                if(unlitInd>=2){
                    a.use=true;
                }
                break;
            }
            case "potion":{
                a.use=true;
                break;
            }
            case "small dog":{
                if(!enemy.name.equals("Demon")&&!enemy.name.equals("Dragon")&&!enemy.name.equals("Troll")){
                    a.use=true;
                }
                break;
            }
            case "stepladder":{
                if(feet<4&&(!enemy.name.equals("Goblin")&&!enemy.name.equals("Lizard"))){
                    a.use=true;
                }
                break;
            }
            case "sunstone":{
                if(litInd>=2){
                    a.use=true;
                }
                break;
            }
            case "symbol":{
                if((enemy.name.equals("Golem")||enemy.name.equals("Demon"))||temp>31){
                    a.use=true;
                }
                break;
            }
            case "ticket":{
                if(((feet>4&&inches>6)||feet>5)&&(fog>=9.2&&fog<=10.4)){
                    a.use=true;
                }
                break;
            }
            case "trophy":{
                if(str>firstDig||enemy.name.equals("Troll")){
                    a.use=true;
                }
                break;
            }
        }
    }
    private int calcWeapons(Weapon w, Enemy e){
        int amount=0;
        if(w.stat.equals("STR"))
        amount=str+w.bonus-e.STR;
        if(w.stat.equals("DEX"))
            amount=dex+w.bonus-e.DEX;
        if(w.stat.equals("INT"))
            amount=INT+w.bonus-e.INT;
        return amount;
    }
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
            java.util.logging.Logger.getLogger(AdventureGame.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(AdventureGame.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(AdventureGame.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(AdventureGame.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                //new AdventureGame().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JButton bPotion;
    private javax.swing.JComboBox<String> cbEnemy;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel10;
    private javax.swing.JLabel jLabel11;
    private javax.swing.JLabel jLabel12;
    private javax.swing.JLabel jLabel13;
    private javax.swing.JLabel jLabel15;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JLabel jLabel5;
    private javax.swing.JLabel jLabel6;
    private javax.swing.JLabel jLabel7;
    private javax.swing.JLabel jLabel8;
    private javax.swing.JLabel jLabel9;
    private javax.swing.JLabel lUsedItems;
    private javax.swing.JLabel lWeapon;
    private javax.swing.JTextField tfAmount;
    private javax.swing.JTextField tfDEX;
    private javax.swing.JTextField tfFOG;
    private javax.swing.JTextField tfFeet;
    private javax.swing.JTextField tfINT;
    private javax.swing.JTextField tfInches;
    private javax.swing.JTextField tfItems;
    private javax.swing.JTextField tfPress;
    private javax.swing.JTextField tfSTR;
    private javax.swing.JTextField tfTemp;
    // End of variables declaration//GEN-END:variables
}
