
#define SCK_Pin 4
#define MOSI_Pin 5
#define MISO_Pin 6
#define SS_Pin 7


void setup() {
  // put your setup code here, to run once:
  SPI_Soft_setup();
  
}

void loop() {
  // put your main code here, to run repeatedly: 
  uint8_t rev;

  rev = SPI_Soft_transfer('A');//ASCII : 0x41 - 65
  Serial.println(rev);
  Serial.println(' ');
}

void SPI_Soft_setup(void)
{
  pinMode(SCK_Pin, INPUT);
  pinMode(MOSI_Pin, INPUT);
  pinMode(SS_Pin, INPUT);
  pinMode(MISO_Pin, OUTPUT);
  Serial.begin(9600);
  delay(1);
}

uint8_t SPI_Soft_transfer(uint8_t Data_out){
  uint8_t Data_in = 0;// 00000000
  uint8_t ibit,res;
  while(digitalRead(SS_Pin) == HIGH); // waiting untill SS = 0 (LOW) " start condition"

  for(ibit=0x80; ibit>0; ibit = ibit>>1)//10000000
  {
    res = Data_out & ibit;//10000000(true) - 00000000(false)
    if( res != 0){ digitalWrite(MISO_Pin, HIGH); }
    else { digitalWrite(MISO_Pin, LOW); }

    while(digitalRead(SCK_Pin) == LOW); //waiting untill SCK = 1 (HIGH)

    if(digitalRead(MOSI_Pin) == HIGH){
      Data_in = Data_in | ibit;//Set bit(Data_in) to 1 at ibit
    }
    
    while(digitalRead(SCK_Pin) == HIGH); // waiting SCK = 0;

    // END 1 clock cycle
  }
  return Data_in;
}