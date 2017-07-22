/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ktanesolver;

/**
 *
 * @author Komp
 */
public class AdjacentLetters extends javax.swing.JFrame {
    String [][] searchedLetters={
        {"GJMOY","HKPRW"},{"IKLRT","CDFYZ"},{"BHIJW","DEMTU"},{"IKOPQ","CJTUW"},{"ACGIJ","KSUWZ"},{"CERVY","AGJPQ"},{"ACFNS","HOQYZ"},{"LRTUX","DKMPS"},{"DLOWZ","EFNUV"},{"BQTUW","EHIOS"},{"AFPXY","DIORZ"},{"GKPTZ","ABRVX"},{"EILQT","BFPWX"},
        {"PQRSV","AFGHL"},{"HJLUZ","IQSTX"},{"DMNOX","CFHKR"},{"CEOPV","BDKIN"},{"AEGSU","BNOXY"},{"ABEKQ","GMVYZ"},{"GVXYZ","CJLSU"},{"FMVXYZ","BILNY"},{"DHMNW","AEJQX"},{"DFHMN","GLQRT"},{"BDFKW","AJNOV"},{"BCHSU","EGMTW"},{"JNRSY","CLMPV"}
    };
    String result;
    public AdjacentLetters() {
        initComponents();
    }
    class Cell{
        boolean pressed;
        String letter;
        Cell(String l, boolean p){
            pressed=p;
            letter=l;
        }
    }
    
    Cell[][] existing;
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        tf1 = new javax.swing.JTextField();
        tf2 = new javax.swing.JTextField();
        tf3 = new javax.swing.JTextField();
        tf4 = new javax.swing.JTextField();
        tf5 = new javax.swing.JTextField();
        tf6 = new javax.swing.JTextField();
        tf7 = new javax.swing.JTextField();
        tf8 = new javax.swing.JTextField();
        tf9 = new javax.swing.JTextField();
        tf10 = new javax.swing.JTextField();
        tf11 = new javax.swing.JTextField();
        tf12 = new javax.swing.JTextField();
        bAccept = new javax.swing.JButton();
        jLabel1 = new javax.swing.JLabel();
        lResult = new javax.swing.JLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);

        tf1.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf1FocusGained(evt);
            }
        });

        tf2.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf2FocusGained(evt);
            }
        });

        tf3.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf3FocusGained(evt);
            }
        });

        tf4.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf4FocusGained(evt);
            }
        });

        tf5.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf5FocusGained(evt);
            }
        });

        tf6.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf6FocusGained(evt);
            }
        });

        tf7.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf7FocusGained(evt);
            }
        });

        tf8.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf8FocusGained(evt);
            }
        });

        tf9.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf9FocusGained(evt);
            }
        });

        tf10.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf10FocusGained(evt);
            }
        });

        tf11.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf11FocusGained(evt);
            }
        });

        tf12.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                tf12FocusGained(evt);
            }
        });

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
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING, false)
                    .addGroup(layout.createSequentialGroup()
                        .addContainerGap()
                        .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                            .addGroup(javax.swing.GroupLayout.Alignment.CENTER, layout.createSequentialGroup()
                                .addComponent(tf9, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf10, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf11, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf12, javax.swing.GroupLayout.PREFERRED_SIZE, 72, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addGroup(javax.swing.GroupLayout.Alignment.CENTER, layout.createSequentialGroup()
                                .addComponent(tf1, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf2, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf3, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf4, javax.swing.GroupLayout.PREFERRED_SIZE, 72, javax.swing.GroupLayout.PREFERRED_SIZE))
                            .addGroup(javax.swing.GroupLayout.Alignment.CENTER, layout.createSequentialGroup()
                                .addComponent(tf5, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf6, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf7, javax.swing.GroupLayout.PREFERRED_SIZE, 69, javax.swing.GroupLayout.PREFERRED_SIZE)
                                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                                .addComponent(tf8, javax.swing.GroupLayout.PREFERRED_SIZE, 72, javax.swing.GroupLayout.PREFERRED_SIZE))))
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                        .addComponent(jLabel1)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(lResult, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(bAccept)))
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(tf1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf2, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf3, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf4, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(tf5, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf6, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf7, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf8, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(tf9, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf10, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf11, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addComponent(tf12, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING)
                    .addComponent(bAccept)
                    .addGroup(layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                        .addComponent(jLabel1)
                        .addComponent(lResult)))
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void bAcceptActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_bAcceptActionPerformed
        result = "";
        existing=new Cell[3][4];
        existing[0][0]= new Cell(tf1.getText().toUpperCase(), false);
        existing[0][1]= new Cell(tf2.getText().toUpperCase(), false);
        existing[0][2]= new Cell(tf3.getText().toUpperCase(), false);
        existing[0][3]= new Cell(tf4.getText().toUpperCase(), false);
        existing[1][0]= new Cell(tf5.getText().toUpperCase(), false);
        existing[1][1]= new Cell(tf6.getText().toUpperCase(), false);
        existing[1][2]= new Cell(tf7.getText().toUpperCase(), false);
        existing[1][3]= new Cell(tf8.getText().toUpperCase(), false);
        existing[2][0]= new Cell(tf9.getText().toUpperCase(), false);
        existing[2][1]= new Cell(tf10.getText().toUpperCase(), false);
        existing[2][2]= new Cell(tf11.getText().toUpperCase(), false);
        existing[2][3]= new Cell(tf12.getText().toUpperCase(), false);
        for(int i=0;i<3;i++){
            for(int j=0;j<4;j++)
                decide(i,j);
        }
        for(int i=0;i<3;i++){
            for(int j=0;j<4;j++)
                if(existing[i][j].pressed)
                    result=result+" "+existing[i][j].letter;
        }
        result=result.trim();
        lResult.setText(result);
        
    }//GEN-LAST:event_bAcceptActionPerformed

    private void tf1FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf1FocusGained
        clearText(tf1);
    }//GEN-LAST:event_tf1FocusGained

    private void tf2FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf2FocusGained
        clearText(tf2);
    }//GEN-LAST:event_tf2FocusGained

    private void tf3FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf3FocusGained
        clearText(tf3);
    }//GEN-LAST:event_tf3FocusGained

    private void tf4FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf4FocusGained
        clearText(tf4);
    }//GEN-LAST:event_tf4FocusGained

    private void tf5FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf5FocusGained
        clearText(tf5);
    }//GEN-LAST:event_tf5FocusGained

    private void tf6FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf6FocusGained
        clearText(tf6);
    }//GEN-LAST:event_tf6FocusGained

    private void tf7FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf7FocusGained
        clearText(tf7);
    }//GEN-LAST:event_tf7FocusGained

    private void tf8FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf8FocusGained
        clearText(tf8);
    }//GEN-LAST:event_tf8FocusGained

    private void tf9FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf9FocusGained
        clearText(tf9);
    }//GEN-LAST:event_tf9FocusGained

    private void tf10FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf10FocusGained
        clearText(tf10);
    }//GEN-LAST:event_tf10FocusGained

    private void tf11FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf11FocusGained
        clearText(tf11);
    }//GEN-LAST:event_tf11FocusGained

    private void tf12FocusGained(java.awt.event.FocusEvent evt) {//GEN-FIRST:event_tf12FocusGained
        clearText(tf12);
    }//GEN-LAST:event_tf12FocusGained
    private void clearText(javax.swing.JTextField i){
        i.setText("");
    }
    private void decide(int a, int b){

        switch(existing[a][b].letter){
            case "A":{
                if(b==0){
                    if(searchedLetters[0][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[0][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[0][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[0][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[0][0].contains(existing[a][b-1].letter)||searchedLetters[0][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[0][1].contains(existing[a-1][b].letter)||searchedLetters[0][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "B":{
                if(b==0){
                    if(searchedLetters[1][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[1][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[1][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[1][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[1][0].contains(existing[a][b-1].letter)||searchedLetters[1][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[1][1].contains(existing[a-1][b].letter)||searchedLetters[1][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "C":{
                if(b==0){
                    if(searchedLetters[2][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[2][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[2][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[2][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[2][0].contains(existing[a][b-1].letter)||searchedLetters[2][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[2][1].contains(existing[a-1][b].letter)||searchedLetters[2][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "D":{
                if(b==0){
                    if(searchedLetters[3][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[3][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[3][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[3][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[3][0].contains(existing[a][b-1].letter)||searchedLetters[3][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[3][1].contains(existing[a-1][b].letter)||searchedLetters[3][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "E":{
                if(b==0){
                    if(searchedLetters[4][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[4][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[4][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[4][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[4][0].contains(existing[a][b-1].letter)||searchedLetters[4][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[4][1].contains(existing[a-1][b].letter)||searchedLetters[4][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "F":{
                if(b==0){
                    if(searchedLetters[5][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[5][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[5][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[5][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[5][0].contains(existing[a][b-1].letter)||searchedLetters[5][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[5][1].contains(existing[a-1][b].letter)||searchedLetters[5][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "G":{
                if(b==0){
                    if(searchedLetters[6][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[6][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[6][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[6][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[6][0].contains(existing[a][b-1].letter)||searchedLetters[6][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[6][1].contains(existing[a-1][b].letter)||searchedLetters[6][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "H":{
                if(b==0){
                    if(searchedLetters[7][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[7][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[7][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[7][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[7][0].contains(existing[a][b-1].letter)||searchedLetters[7][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[7][1].contains(existing[a-1][b].letter)||searchedLetters[7][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "I":{
                if(b==0){
                    if(searchedLetters[8][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[8][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[8][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[8][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[8][0].contains(existing[a][b-1].letter)||searchedLetters[8][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[8][1].contains(existing[a-1][b].letter)||searchedLetters[8][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "J":{
                if(b==0){
                    if(searchedLetters[9][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[9][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[9][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[9][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[9][0].contains(existing[a][b-1].letter)||searchedLetters[9][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[9][1].contains(existing[a-1][b].letter)||searchedLetters[9][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "K":{
                if(b==0){
                    if(searchedLetters[10][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[10][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[10][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[10][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[10][0].contains(existing[a][b-1].letter)||searchedLetters[10][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[10][1].contains(existing[a-1][b].letter)||searchedLetters[10][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "L":{
                if(b==0){
                    if(searchedLetters[11][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[11][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[11][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[11][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[11][0].contains(existing[a][b-1].letter)||searchedLetters[11][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[11][1].contains(existing[a-1][b].letter)||searchedLetters[11][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "M":{
                if(b==0){
                    if(searchedLetters[12][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[12][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[12][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[12][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[12][0].contains(existing[a][b-1].letter)||searchedLetters[12][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[12][1].contains(existing[a-1][b].letter)||searchedLetters[12][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "N":{
                if(b==0){
                    if(searchedLetters[13][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[13][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[13][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[13][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[13][0].contains(existing[a][b-1].letter)||searchedLetters[13][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[13][1].contains(existing[a-1][b].letter)||searchedLetters[13][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "O":{
                if(b==0){
                    if(searchedLetters[14][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[14][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[14][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[14][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[14][0].contains(existing[a][b-1].letter)||searchedLetters[14][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[14][1].contains(existing[a-1][b].letter)||searchedLetters[14][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "P":{
                if(b==0){
                    if(searchedLetters[15][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[15][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[15][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[15][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[15][0].contains(existing[a][b-1].letter)||searchedLetters[15][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[15][1].contains(existing[a-1][b].letter)||searchedLetters[15][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "Q":{
                if(b==0){
                    if(searchedLetters[16][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[16][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[16][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[16][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[16][0].contains(existing[a][b-1].letter)||searchedLetters[16][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[16][1].contains(existing[a-1][b].letter)||searchedLetters[16][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "R":{
                if(b==0){
                    if(searchedLetters[17][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[17][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[17][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[17][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[17][0].contains(existing[a][b-1].letter)||searchedLetters[17][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[17][1].contains(existing[a-1][b].letter)||searchedLetters[17][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "S":{
                if(b==0){
                    if(searchedLetters[18][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[18][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[18][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[18][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[18][0].contains(existing[a][b-1].letter)||searchedLetters[18][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[18][1].contains(existing[a-1][b].letter)||searchedLetters[18][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "T":{
                if(b==0){
                    if(searchedLetters[19][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[19][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[19][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[19][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[19][0].contains(existing[a][b-1].letter)||searchedLetters[19][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[19][1].contains(existing[a-1][b].letter)||searchedLetters[19][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "U":{
                if(b==0){
                    if(searchedLetters[20][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[20][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[20][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[20][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[20][0].contains(existing[a][b-1].letter)||searchedLetters[20][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[20][1].contains(existing[a-1][b].letter)||searchedLetters[20][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "V":{
                if(b==0){
                    if(searchedLetters[21][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[21][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[21][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[21][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[21][0].contains(existing[a][b-1].letter)||searchedLetters[21][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[21][1].contains(existing[a-1][b].letter)||searchedLetters[21][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "W":{
                if(b==0){
                    if(searchedLetters[22][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[22][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[22][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[22][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[22][0].contains(existing[a][b-1].letter)||searchedLetters[22][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[22][1].contains(existing[a-1][b].letter)||searchedLetters[22][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "X":{
                if(b==0){
                    if(searchedLetters[23][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[23][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[23][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[23][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[23][0].contains(existing[a][b-1].letter)||searchedLetters[23][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[23][1].contains(existing[a-1][b].letter)||searchedLetters[23][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "Y":{
                if(b==0){
                    if(searchedLetters[24][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[24][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[24][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[24][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[24][0].contains(existing[a][b-1].letter)||searchedLetters[24][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[24][1].contains(existing[a-1][b].letter)||searchedLetters[24][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
            case "Z":{
                if(b==0){
                    if(searchedLetters[25][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;   
                }
                if(b==3){
                    if(searchedLetters[25][0].contains(existing[a][b-1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==0){
                    if(searchedLetters[25][1].contains(existing[a+1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(a==2){
                    if(searchedLetters[25][1].contains(existing[a-1][b].letter))
                        existing[a][b].pressed=true;
                }
                if(b==1||b==2){
                    if(searchedLetters[25][0].contains(existing[a][b-1].letter)||searchedLetters[25][0].contains(existing[a][b+1].letter))
                        existing[a][b].pressed=true;
                }
                if(a==1){
                    if(searchedLetters[25][1].contains(existing[a-1][b].letter)||searchedLetters[25][1].contains(existing[a+1][b].letter))
                            existing[a][b].pressed=true;
                }
                break;
            }
        }
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
            java.util.logging.Logger.getLogger(AdjacentLetters.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (InstantiationException ex) {
            java.util.logging.Logger.getLogger(AdjacentLetters.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (IllegalAccessException ex) {
            java.util.logging.Logger.getLogger(AdjacentLetters.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        } catch (javax.swing.UnsupportedLookAndFeelException ex) {
            java.util.logging.Logger.getLogger(AdjacentLetters.class.getName()).log(java.util.logging.Level.SEVERE, null, ex);
        }
        //</editor-fold>

        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new AdjacentLetters().setVisible(true);
            }
        });
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton bAccept;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel lResult;
    private javax.swing.JTextField tf1;
    private javax.swing.JTextField tf10;
    private javax.swing.JTextField tf11;
    private javax.swing.JTextField tf12;
    private javax.swing.JTextField tf2;
    private javax.swing.JTextField tf3;
    private javax.swing.JTextField tf4;
    private javax.swing.JTextField tf5;
    private javax.swing.JTextField tf6;
    private javax.swing.JTextField tf7;
    private javax.swing.JTextField tf8;
    private javax.swing.JTextField tf9;
    // End of variables declaration//GEN-END:variables
}
