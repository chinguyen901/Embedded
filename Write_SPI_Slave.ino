
#define SCK_Pin 4
#define MOSI_Pin 5
#define MISO_Pin 6
#define SS_Pin 7

#define SCK_IN DDRD |= (1 << DDD4) //pinMode(SCK_Pin, OUTPUT);
#define MOSI_IN DDRD |= (1 << DDD5)
#define SS_IN DDRD |= (1 << DDD7)
#define MISO_OUT DDRD &= ~(1 << DDD6) //pinMode(MISO_PIN, INPUT)

#define read_SCK() ( (PIND & (1 << PIND4)) ? HIGH:LOW)
#define read_MOSI() ( (PIND & (1 << PIND5)) ? HIGH:LOW)
#define read_SS() ( (PIND & (1 << PIND7)) ? HIGH:LOW)
#define write_MISO(x) PORTD = ( (x) ? (PORTD | 1<<PD6) : (PORTD & (~(1<<PD6))) )


void setup() {
  // put your setup code here, to run once:
  SPI_Soft_setup();

}

void loop() {
  // put your main code here, to run repeatedly: 
  uint8_t rev;
  rev = SPI_Soft_transfer('A');//ASCII : 0x41 - 65
  Serial.println(rev);
  Serial.println('-');
}

void SPI_Soft_setup(void)
{
  SCK_IN;
  MOSI_IN;
  SS_IN;
  MISO_OUT;
}

uint8_t SPI_Soft_transfer(uint8_t Data_out){
  uint8_t Data_in = 0;// 00000000
  uint8_t ibit,res;
  while(read_SS() == HIGH); // waiting untill SS = 0 (LOW) " start condition"

  for(ibit=0x80; ibit>0; ibit = ibit>>1)//10000000
  {
    res = Data_out & ibit;//10000000(true) - 00000000(false)
    write_MISO(res);

    while(read_SCK() == LOW); //waiting untill SCK = 1 (HIGH)

    if(read_MOSI() == HIGH){
      Data_in = Data_in | ibit;//Set bit(Data_in) to 1 at ibit
    }
    
    while(read_SCK() == HIGH); // waiting SCK = 0;

    // END 1 clock cycle
  }
}
