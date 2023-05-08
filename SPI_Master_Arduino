
// SPI speed: MHz, kHz (Simulation)
//Slow_01 : f =20kHz -> T = 50us
//Slow_02 : f = 1kHz -> T = 1000us

#define TFull 50
#define THalf TFull/2

#define SCK_Pin 4
#define MOSI_Pin 5
#define MISO_Pin 6
#define SS_Pin 7

#define SCK_OUT pinMode(SCK_Pin, OUTPUT) //DDRD |= (1 << DDD4) 
#define MOSI_OUT pinMode(MOSI_Pin, OUTPUT)// DDRD |= (1 << DDD5)
#define SS_OUT pinMode(SS_Pin, OUTPUT)// DDRD |= (1 << DDD7)
#define MISO_IN pinMode(MISO_Pin, INPUT)//DDRD &= ~(1 << DDD6) //pinMode(MISO_PIN, INPUT);

//#define MOSI_HIGH PORTD |= (1 << PD5) //digitalWrite (MOSI_PIN, HIGH); //HIGH = 1
//#define MOSI_LOW PORTD &= ~(1 << PD5) //digitalWrite (MOSI_PIN, LOW); //LOW = 0

//a = (value) ? x : y; // if (value == true) a = x; else a = y;// Tam dang thuc//true =1 ; false = 0
#define write_MOSI(x) MOSI_Pin = ((x) ? HIGH:LOW)
// #define write_SS(x) PORTD = ((x) ? (PORTD | 1<<PD7):(PORTD & (~(1<<PD7))))
// #define write_SCK(x) PORTD = ((x) ? (PORTD | 1<<PD4):(PORTD & (~(1<<PD4))))
// #define read_MISO() ( (PIND & (1 << PIND6)) ? HIGH:LOW ) // digitalRead(MISO_Pin)


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
  Serial.println(1);
  delay(1000);
}

void SPI_Soft_setup(void)
{
  MOSI_OUT;
  MISO_IN;
  digitalWrite(SCK_Pin,LOW);
  SCK_OUT;
  digitalWrite(SS_Pin,HIGH)
  SS_OUT;
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
    write_MOSI(res);//10000000 - 00000000
    //step 2
    delayMicroseconds(THalf);
    digitalWrite(SCK_Pin,HIGH);
    //step 3
    if(digitalRead(MISO_Pin) == HIGH ){
      Data_in = Data_in | ibit; // 000000000 & 10000000  = 10000000;
    }
    // Step 4
    delayMicroseconds(THalf);
    digitalWrite(SCK_Pin,LOW)// end 1 clock cycle
  }
  return Data_in;
}



