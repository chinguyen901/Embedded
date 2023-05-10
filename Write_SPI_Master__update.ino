// SPI speed: MHz, kHz (Simulation)
//Slow_01 : f =20kHz -> T = 50us
//Slow_02 : f = 1kHz -> T = 1000us

#define TFull 50
#define THalf TFull/2

#define SCK_Pin 4
#define MOSI_Pin 5
#define MISO_Pin 6
#define SS_Pin 7


void setup() {
  SPI_Soft_setup();
}

void loop() {
  // put your main code here, to run repeatedly:
  uint8_t rev;
  SPI_Soft_begin();// SS = 0

  rev = SPI_Soft_transfer('a');//ASCII: 0x61 - 97 
  SPI_Soft_end();
  Serial.println(rev);
  Serial.println(' ');
  delay(1000);
}

void SPI_Soft_setup(void)
{
  pinMode(MOSI_Pin, OUTPUT);
  pinMode(MISO_Pin, INPUT);
  digitalWrite(SCK_Pin,LOW);
  pinMode(SCK_Pin, OUTPUT);
  digitalWrite(SS_Pin,HIGH);
  pinMode(SS_Pin, OUTPUT);
  Serial.begin(9600);//Setup Arduino transfer 9600 bit/s
  delay(1);
}

void SPI_Soft_begin(void)
{
  digitalWrite(SS_Pin,LOW);
}

void SPI_Soft_end(void)
{
  digitalWrite(SCK_Pin,LOW);
  digitalWrite(SS_Pin,HIGH);
}
// MODE0: CPOL = 0, CPHASE = 0, bitOder = MSB.
// mDta = 0x55 ( 01010101). mData&0x80 = 01010101 & 10000000 = 00000000 = 0
uint8_t SPI_Soft_transfer (uint8_t Data_out)
{
  uint8_t Data_in = 0;//00000000
  uint8_t ibit; 
  uint8_t res;

  for( ibit = 0x80; ibit > 0; ibit = ibit >> 1){
    //step 1
    res = Data_out&ibit;// (#0=true),(=0=false)
    if( res!= 0){
      digitalWrite(MOSI_Pin,HIGH);
    }
    else{
      digitalWrite(MOSI_Pin,LOW);
    }//10000000 - 00000000
    //step 2
    delayMicroseconds(THalf);
    digitalWrite(SCK_Pin,HIGH);
    //step 3
    if(digitalRead(MISO_Pin) == HIGH ){
      Data_in = Data_in | ibit; // 000000000 & 10000000  = 10000000;
    }
    // Step 4
    delayMicroseconds(THalf);
    digitalWrite(SCK_Pin,LOW);// end 1 clock cycle
  }
  return Data_in;
}