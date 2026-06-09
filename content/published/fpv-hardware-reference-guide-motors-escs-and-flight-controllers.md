# FPV Hardware Reference Guide: Motors, ESCs, and Flight Controllers

> A comprehensive reference covering motor sizing, ESC protocols, and FC selection.

## FPV Hardware Reference Guide: Motors, ESCs, and Flight Controllers

# FPV Donanım Ekosistemi: İlk Uçuşunuz İçin Her Temel Bileşene ve Bağlantılarına Başlangıç Rehberi

FPV drone dünyasına dalarken karşılaştığınız kısaltmalar ve bileşenlerin yoğunluğu karşısında bunaldığınızı hiç hissettiniz mi? Yalnız değilsiniz! Bir FPV quadcopter inşa etmek veya sadece anlamak, yeni bir dil öğrenmek gibi gelebilir. Ancak gökyüzünde süzüldüğünüzü, dünyayı bir kuş bakışı görüyorsunuz ve tüm bunlar akıllıca tasarlanmış donanımların uyum içinde çalışması sayesinde gerçekleşiyor, bir düşünün. Bu rehber, FPV dünyasının Rosetta Taşı'nız olacak. Her temel FPV donanım parçasını açıklayacak, ne işe yaradığını anlatacak ve bu bileşenlerin ilk FPV drone'unuzu hayata geçirmek için nasıl bağlandığını göstereceğiz. Gelecekteki uçan makinenizin 'içini' anlamaya hazır olun!

## Operasyonun Beyni: Uçuş Kontrol Kartı (FC)

### Uçuş Kontrol Kartı Nedir ve Neden Hayati Önem Taşır?

Uçuş kontrol kartı (FC), FPV drone'unuzun merkezi işlem birimi, yani beynidir. Pilotun komutlarını yorumlar ve drone'u stabilize eder. Temel olarak, drone'un ne zaman hızlanacağını, ne zaman döneceğini veya ne zaman havada sabit kalacağını belirleyen tüm hesaplamaları yapar. Çevresel sensörlerden (jiroskop, ivmeölçer) veri alır, bunları pilotun radyo kumandasından gelen sinyallerle birleştirir ve ardından motorlara ne yapmaları gerektiğini söyler. FC, tüm diğer elektronik bileşenleri yöneten orkestra şefidir.

### Aranacak Temel Özellikler ve Teknik Özellikler

Bir FC seçerken dikkat etmeniz gereken bazı önemli noktalar vardır:

*   **Mikrodenetleyici Birimi (MCU):** Bu, FC'nin işlemcisidir. Günümüzde yaygın olarak **STM32F4** veya daha güçlü **STM32F7** ve **STM32H7** çiplerini görürsünüz. Daha yeni çipler, daha hızlı işlem gücü ve daha fazla UART (seri port) sunarak daha fazla çevre birimi bağlamanıza olanak tanır.
*   **Jiroskop/İvmeölçer:** Drone'un hareketini ve yönünü algılayan sensörlerdir. Genellikle **MPU6000**, **ICM20689** veya **BMI270** gibi modeller kullanılır. Daha iyi sensörler, daha temiz ve doğru uçuş verileri sağlar, bu da drone'unuzun daha stabil ve hassas uçmasını sağlar.
*   **Barometre:** İsteğe bağlı bir sensördür ancak özellikle GPS özellikli uzun menzilli drone'larda faydalıdır. Rakım bilgisini sağlar ve drone'un belirli bir yükseklikte kalmasına yardımcı olabilir.
*   **Ekran Üstü Gösterim (OSD):** Çoğu modern FC'de yerleşik olarak bulunur. Uçuş sırasında FPV gözlüğünüzde pil voltajı, uçuş süresi, hız ve sinyal gücü gibi önemli bilgileri görmenizi sağlar. Bu, uçuş güvenliği ve bilgi akışı için kritik bir özelliktir.

**Pratik İpucu:** Başlangıç seviyesi için, bir F4 veya F7 tabanlı FC yeterli olacaktır. Daha güçlü bir FC, gelecekteki yükseltmeler ve daha karmaşık özellikler için size daha fazla esneklik sunar.

### FC ve Hepsi Bir Arada (AIO) Kartlar: Yapınızı Basitleştirmek

FC'ler genellikle tek başına bir kart olarak gelirken, özellikle yeni başlayanlar için **Hepsi Bir Arada (AIO) kartlar** oldukça popülerdir. AIO kartlar, uçuş kontrol kartını (FC) ve elektronik hız kontrol cihazlarını (ESC'ler) tek bir kart üzerinde birleştirir.

*   **FC Kartları (Ayrı):** Geleneksel olarak, FC ve ESC'ler ayrı kartlardır. Bu, daha fazla özelleştirme ve arıza durumunda tek bir bileşeni değiştirme esnekliği sunar. Genellikle daha büyük ve performans odaklı drone'larda tercih edilir.
*   **AIO Kartlar:** Özellikle küçük drone'larda (Tiny Whoop, 3 inç gibi) ve yeni başlayanlar için kablolamayı büyük ölçüde basitleştirir. Daha az lehim noktası ve daha az karmaşık bağlantı anlamına gelir. Ancak, kart üzerindeki bir bileşen arızalanırsa (örneğin bir ESC yanarsa), tüm kartı değiştirmeniz gerekebilir. **SpeedyBee F405 AIO** gibi popüler modeller, yeni başlayanlar için harika bir başlangıç noktasıdır.

**Yeni Başlayanlar İçin:** AIO kartlar, ilk yapınız için harika bir seçim olabilir. Kurulumu basitleştirir ve hata yapma olasılığını azaltır.

## Kaslar ve Hareket: ESC'ler, Motorlar ve Pervaneler

### Elektronik Hız Kontrol Cihazları (ESC'ler): Motorlarınızı Hassas Bir Şekilde Güçlendirme

Elektronik Hız Kontrol Cihazları (ESC'ler), uçuş kontrol kartından gelen sinyalleri alır ve bu sinyalleri motorların hızını kontrol etmek için kullanır. Her motor için bir ESC bulunur. ESC'ler, motorlara giden gücü düzenleyerek drone'un hızlanmasını, yavaşlamasını ve yönünü değiştirmesini sağlar.

*   **Tekli ESC'ler vs. 4'ü 1 Arada ESC'ler:**
    *   **Tekli ESC'ler:** Her motorun kendi ayrı ESC'si vardır. Genellikle drone kollarına monte edilirler. Ağırlığı kollara dağıtır ve bir ESC arızalandığında sadece o birimi değiştirmeniz yeterlidir.
    *   **4'ü 1 Arada ESC'ler:** Dört ESC'yi tek bir kart üzerinde birleştirir. FC'nin altına veya üstüne monte edilir. Kablolamayı büyük ölçüde basitleştirir ve daha temiz bir yapı sağlar. Günümüzde çoğu FPV quadcopter'da tercih edilen seçenektir.
*   **Akım Derecelendirmeleri (Amper):** ESC'lerinizin, motorlarınızın çekeceği maksimum akımı kaldırabilecek kapasitede olması gerekir. Örneğin, 30A veya 45A dereceli ESC'ler yaygındır. Genellikle motorlarınızın ve pervanelerinizin maksimum çekebileceği akıma göre biraz daha yüksek bir derecelendirme seçmek güvenli tarafta kalmanızı sağlar. **Hobbywing XRotor 60A 4-in-1 ESC** gibi modeller, yüksek performanslı drone'lar için popülerdir.

### Motor Tiplerini ve KV Derecelendirmelerini Anlamak

FPV drone'ları, fırçasız (brushless) motorlar kullanır. Bu motorlar, fırçalı motorlara göre daha verimli, daha güçlü ve daha dayanıklıdır.

*   **Stator Boyutu:** Motorların boyutunu belirler (örneğin, **2207** veya **2306**). İlk iki rakam statorun çapını (mm), son iki rakam ise statorun yüksekliğini (mm) gösterir. Daha büyük motorlar genellikle daha fazla tork ve güç üretir, ancak daha ağırdır ve daha fazla güç tüketir.
*   **KV Derecelendirmesi:** Bir motorun volt başına dakikadaki dönüş sayısını (RPM/V) gösterir. Yüksek KV'li motorlar (örneğin, **2400KV**), aynı voltajda daha hızlı döner ve daha yüksek hızlara ulaşır, ancak daha az tork üretir. Düşük KV'li motorlar (örneğin, **1750KV**), daha yavaş döner ancak daha fazla tork üretir ve genellikle daha verimlidir, bu da daha uzun uçuş süreleri sağlayabilir.
    *   **Pratik İpucu:** 5 inç freestyle drone'lar için 4S pillerle 2207 2400KV veya 6S pillerle 2207 1950KV gibi motorlar yaygındır. Tiny Whoop'lar için ise daha küçük, yüksek KV'li motorlar (örneğin, 0802 19000KV) kullanılır.

### Pervaneler: Drone'unuzun Kanatları

Pervaneler, motorların dönme hareketini itme kuvvetine dönüştüren bileşenlerdir.

*   **Boyut:** Pervanenin bir ucundan diğer ucuna olan çapını inç cinsinden ifade eder (örneğin, **5 inç**). Drone'unuzun çerçevesine ve motorlarına uygun boyutu seçmeniz gerekir.
*   **Pitch (Adım):** Pervane kanadının bir tam turda havada ne kadar ilerleyeceğini teorik olarak gösterir. Daha yüksek pitch'li pervaneler daha hızlıdır ancak daha fazla güç gerektirir; daha düşük pitch'li pervaneler daha verimli ve kontrolü daha kolaydır.
*   **Bıçak Sayısı:** Pervanenin kaç adet kanada sahip olduğunu belirtir (örneğin, 2 bıçaklı, 3 bıçaklı veya 4 bıçaklı). Daha fazla bıçak, daha fazla itme kuvveti ve daha yumuşak bir uçuş sağlayabilir, ancak genellikle daha az verimlidir ve daha gürültülüdür. **Gemfan 51433** (5 inç, 3 bıçaklı) gibi pervaneler freestyle için popülerdir.

**Pratik İpucu:** Çoğu 5 inç freestyle drone için 3 bıçaklı pervaneler iyi bir denge sunar. Farklı pervane türlerini denemek, uçuş hissinizi ve verimliliğinizi önemli ölçüde değiştirebilir.

## Gökyüzündeki Gözleriniz: FPV Kamera ve Video Verici (VTX)

### FPV Kameralar: Manzarayı Yakalamak

FPV kameraları, drone'unuzun önünden canlı video akışını yakalar ve size gözlüğünüze iletir.

*   **Kamera Tipleri:**
    *   **Mikro, Mini, Standart:** Bu terimler kameranın fiziksel boyutunu ifade eder. Çerçeve boyutunuza uygun olanı seçmelisiniz. Mikro kameralar küçük drone'larda (örneğin, **RunCam Nano 3**), standart kameralar ise 5 inç ve üzeri drone'larda (örneğin, **Caddx Ratel 2**) yaygındır.
*   **Sensör Teknolojileri:**
    *   **CMOS:** Günümüzdeki çoğu FPV kamerasında kullanılır. Genellikle daha iyi düşük ışık performansı ve daha geniş dinamik aralık sunar.
    *   **CCD:** Eski bir teknoloji olmasına rağmen, belirli senaryolarda (örneğin, hızlı ışık değişikliklerinde daha iyi dinamik aralık) hala tercih edenler olabilir.
*   **Gecikme (Latency):** Kameradan gözlüğünüze giden video sinyalindeki gecikmeyi ifade eder. FPV uçuşu için düşük gecikme (genellikle 20-40ms altı) hayati önem taşır, çünkü bu, drone'a gerçek zamanlı tepki vermenizi sağlar.
*   **Görüş Alanı (FOV):** Kameranın ne kadar geniş bir alanı görebildiğini belirler. Daha geniş FOV (örneğin, 150°+) daha sürükleyici bir deneyim sunar, ancak görüntüyü biraz bozabilir (balık gözü etkisi).

### Video Vericiler (VTX): Sinyali Göndermek

Video Verici (VTX), FPV kameradan gelen video sinyalini alır ve radyo dalgaları aracılığıyla FPV gözlüğünüze iletir.

*   **Güç Çıkışı (mW):** VTX'in sinyali ne kadar uzağa ve ne kadar güçlü gönderebileceğini belirler. Genellikle 25mW'dan (kapalı alan veya yarışma için) 800mW veya daha fazlasına (uzun menzilli uçuşlar için) kadar seçenekler bulunur. Yüksek güç, daha iyi sinyal penetrasyonu ve menzil anlamına gelir, ancak daha fazla ısı üretir ve daha fazla güç tüketir. **Rush Tank Mini** veya **TBS Unify Pro32 Nano** gibi VTX'ler popülerdir.
*   **Kanallar:** VTX'ler, farklı frekanslarda yayın yapabilir. Bu kanallar, birden fazla pilotun aynı anda uçmasına ve birbirlerinin sinyallerini engellememesine olanak tanır.
*   **Smart Audio/Tramp Protokolleri:** Bu protokoller, uçuş kontrol kartınız aracılığıyla VTX ayarlarını (güç çıkışı, kanal vb.) uzaktan değiştirmenize olanak tanır. Bu, VTX üzerindeki düğmelere basmak yerine gözlüğünüzden veya radyo kumandanızdan ayar yapabilmenizi sağlar, bu da çok kullanışlıdır.

### Antenler: Video Netliği İçin Kritik Bağlantı

VTX anteni, video sinyalinin kalitesi ve menzili için VTX kadar önemlidir.

*   **Tipler:**
    *   **Doğrusal (Linear):** Genellikle daha ucuzdur ve daha az verimlidir. Genellikle "çubuk" antenler olarak bilinir.
    *   **Dairesel Polarize (Circular Polarized - CP):** FPV için standarttır. Video sinyalinin daha az parazit almasını sağlar ve "çok yollu bozulma" (multipathing) etkisini azaltır. LHCP (Sol El Dairesel Polarize) ve RHCP (Sağ El Dairesel Polarize) olmak üzere iki türü vardır. Drone ve gözlük antenlerinizin aynı polarizasyonda olması GEREKİR.
*   **Konektörler:**
    *   **SMA, RP-SMA:** Daha büyük ve dayanıklı konektörlerdir, genellikle 5 inç drone'larda kullanılır.
    *   **UFL (IPEX):** Çok küçük ve hafif konektörlerdir, genellikle mikro drone'larda veya VTX'in doğrudan kart üzerinde olduğu durumlarda kullanılır.

**Pratik İpucu:** Her zaman drone'unuzdaki ve gözlüğünüzdeki antenlerin aynı polarizasyona (LHCP veya RHCP) sahip olduğundan emin olun. Karışık polarizasyon, zayıf video kalitesine yol açacaktır. **Foxeer Lollipop** veya **Lumenier AXII** gibi CP antenler popüler seçeneklerdir.

## Komuta Merkezi: Alıcı (RX) ve Radyo Verici (TX)

### Radyo Vericileri (TX): Ellerinizdeki Kontrol

Radyo vericisi (TX), pilotun drone'u kontrol etmek için kullandığı kumandadır. FPV deneyiminizin en kişisel parçalarından biridir.

*   **Gimballar:** Kumandanın çubuklarını içeren mekanizmalardır. Hall sensörlü gimballar, daha pürüzsüz ve hassas kontrol sağladıkları için popülerdir.
*   **Anahtarlar ve Düğmeler:** Drone'u kol kurma/devre dışı bırakma, uçuş modlarını değiştirme veya buzzer'ı etkinleştirme gibi çeşitli işlevler için kullanılır.
*   **Temel Radyo Fonksiyonları:** Kumanda, pilotun hareketlerini radyo sinyallerine dönüştürür ve bu sinyalleri drone üzerindeki alıcıya (RX) gönderir. **Radiomaster Zorro** veya **Jumper T-Pro** gibi kumandalar, kompakt boyutları ve çok yönlü protokol desteği ile başlangıç için harika seçeneklerdir.

### Alıcılar (RX): Komutlarınızı Dinlemek

Alıcı (RX), drone üzerindeki küçük bir karttır ve radyo vericinizden (TX) gelen sinyalleri alır. Bu sinyalleri yorumlar ve uçuş kontrol kartına (FC) iletir, böylece FC pilotun komutlarını uygulayabilir.

*   **Farklı Alıcı Tipleri ve FC Bağlantıları:** Alıcılar, kullandıkları radyo protokolüne ve fiziksel boyutlarına göre değişir. Genellikle FC'ye UART (seri port) üzerinden bağlanırlar.

### İletişim Protokollerini Anlamak (ELRS, Crossfire, FrSky)

Radyo protokolleri, verici ile alıcı arasındaki iletişimin dilidir.

*   **ExpressLRS (ELRS):** Açık kaynaklı, yüksek performanslı ve düşük gecikmeli bir protokoldür. Mükemmel menzil, sağlam bağlantı ve hızlı yenileme hızı sunar. Yeni başlayanlar ve deneyimli pilotlar arasında hızla popülerlik kazanmıştır. **Happymodel EP1/EP2** gibi ELRS alıcılar çok küçüktür.
*   **TBS Crossfire:** Uzun menzilli ve sağlam bağlantı için bilinen, tescilli bir protokoldür. Güvenilirliği nedeniyle genellikle uzun menzilli ve sinyal penetrasyonunun önemli olduğu durumlarda tercih edilir.
*   **FrSky:** Daha eski ve yaygın bir protokoldür. Çeşitli modelleri (ACCST, ACCESS) bulunur. Genellikle başlangıç seviyesi drone'larda ve daha düşük maliyetli seçeneklerde hala kullanılır.

**Pratik İpucu:** Günümüzde ExpressLRS, menzil, gecikme ve maliyet açısından en iyi dengeyi sunar ve yeni başlayanlar için şiddetle tavsiye edilir. Kumandanızın ELRS modülünü desteklediğinden veya dahili ELRS'ye sahip olduğundan emin olun.

## Güç Kaynağı: Bataryalar ve Güç Dağıtımı

### LiPo Bataryalar: Uçuşunuzu Beslemek

Lityum Polimer (LiPo) bataryalar, FPV drone'larının temel güç kaynağıdır. Hafif olmalarına rağmen yüksek güç çıkışı sağlarlar.

*   **Voltaj (S-sayısı):** Bataryanın kaç hücreden oluştuğunu gösterir. Her hücre yaklaşık 3.7V nominal voltaja sahiptir.
    *   **3S:** 3 hücre (3 x 3.7V = 11.1V)
    *   **4S:** 4 hücre (4 x 3.7V = 14.8V)
    *   **6S:** 6 hücre (6 x 3.7V = 22.2V)
    Daha yüksek S-sayısı, daha fazla güç ve hız anlamına gelir. 5 inç freestyle drone'larda 4S ve 6S bataryalar yaygındır.
*   **Kapasite (mAh):** Bataryanın ne kadar enerji depolayabildiğini gösterir (miliamper saat). Daha yüksek mAh, potansiyel olarak daha uzun uçuş süresi anlamına gelir, ancak bataryayı daha ağır hale getirir. 5 inç drone'lar için 1300mAh - 1800mAh arası bataryalar yaygındır.
*   **Deşarj Oranı (C-Derecesi):** Bataryanın güvenli bir şekilde ne kadar hızlı akım sağlayabileceğini gösterir. Örneğin, 75C veya 120C. Daha yüksek C-derecesi, motorların ani güç taleplerini daha iyi karşılayabilir ve "sagging" (voltaj düşüşü) riskini azaltır.

**Pratik İpucu:** Her zaman drone'unuzun motorları ve ESC'leri ile uyumlu bir S-sayısı seçin. Yüksek C-derecesine sahip bataryalar, özellikle agresif uçuş tarzları için daha iyi performans sunar. **Tattu R-Line** veya **GNB (Gaoneng)** bataryalar, FPV topluluğunda iyi bilinir.

### Batarya Şarj Cihazları: Güvenlik ve Uzun Ömür İçin Temel

LiPo bataryalar, özel şarj cihazları gerektirir. Yanlış şarj, bataryaya zarar verebilir veya yangına neden olabilir.

*   **Dengeleme Şarjı:** LiPo bataryaların hücrelerini eşit voltajda tutmak için kritik öneme sahiptir. Çoğu modern LiPo şarj cihazı, bu işlevi otomatik olarak yapar.
*   **Depolama Voltajı:** Bataryaları uzun süre saklarken, hücre başına 3.8V civarında bir "depolama voltajında" tutmak ömrünü uzatır.
*   **Güvenlik:** Her zaman LiPo bataryaları yanmaz bir yüzeyde ve denetim altında şarj edin. LiPo güvenlik çantaları kullanmak şiddetle tavsiye edilir. **ISDT Q6 Nano** veya **ToolkitRC M4Q** gibi şarj cihazları, FPV pilotları arasında popülerdir.

### Güç Dağıtım Kartı (PDB) ve Regülatörler

*   **PDB:** Ayrı ESC'ler kullanılan eski veya özel yapılarda, bir Güç Dağıtım Kartı (PDB), bataryadan gelen gücü ESC'lere ve diğer bileşenlere dağıtır. Modern 4'ü 1 arada ESC'ler ve AIO kartlar genellikle yerleşik güç dağıtımına sahiptir, bu nedenle ayrı bir PDB'ye nadiren ihtiyaç duyulur.
*   **Voltaj Regülatörleri (BEC):** Çoğu FC ve AIO kartta yerleşik olarak bulunur. Batarya voltajını (örneğin 4S veya 6S) FPV kamera, VTX ve alıcı gibi hassas elektronikler için uygun voltaja (örneğin 5V veya 9V) düşürür.

## Temel: Çerçeve ve Temel Donanım

### FPV Drone Çerçeveleri: İskeletinizi Seçmek

Çerçeve, drone'unuzun tüm bileşenlerini bir arada tutan iskelettir.

*   **Farklı Çerçeve Boyutları:**
    *   **Tiny Whoop / Cinewhoop:** Genellikle 65mm'den 90mm'ye kadar, iç mekan veya yavaş, sinematik uçuşlar için tasarlanmıştır.
    *   **3 inç / Toothpick:** Daha küçük, hafif ve çevik. Hem iç hem de dış mekanlarda eğlenceli olabilir.
    *   **5 inç:** FPV freestyle ve yarış için en yaygın boyuttur. Çeşitli motor ve pervane kombinasyonlarını barındırır. **iFlight Nazgul5 V3** veya **GEPRC Mark5** gibi 5 inç çerçeveler popülerdir.
    *   **7 inç / Uzun Menzil:** Daha büyük bataryalar ve daha uzun uçuş süreleri için tasarlanmıştır.
*   **Malzemeler:** Neredeyse tüm FPV çerçeveleri, hafiflik ve dayanıklılık dengesi nedeniyle **karbon fiberden** yapılmıştır.
*   **Tasarımlar (X, H, Deadcat):**
    *   **X Tipi:** En yaygın ve dengeli tasarım. Tüm motorlar merkeze eşit uzaklıktadır.
    *   **H Tipi:** Daha uzun bir gövdeye sahiptir, genellikle GoPro gibi ek ekipman taşımak için daha fazla alan sunar.
    *   **Deadcat Tipi:** Ön motorlar daha geniştir, böylece pervaneler FPV kamera görüş alanına girmez. Özellikle sinematik çekimler için tercih edilir.

**Pratik İpucu:** Yeni başlayanlar için 5 inç bir freestyle çerçeve, öğrenme eğrisi ve parça bulunabilirliği açısından harika bir başlangıç noktasıdır.

### Temel Donanım ve Aksesuarlar

Küçük ama hayati parçalar, drone'unuzu bir arada tutar:

*   **Standoff'lar:** FC, ESC ve diğer kartları çerçeveden ayırmak için kullanılır, kısa devreleri önler ve bileşenler arasında hava akışı sağlar.
*   **Vidalar ve Somunlar:** Tüm bileşenleri çerçeveye sabitlemek için kullanılır. Çeşitli boyutlarda ve tiplerde gelirler (M2, M3 vb.).
*   **Batarya Kayışları:** LiPo bataryayı drone'a güvenli bir şekilde sabitlemek için kullanılır. Bataryanın uçuş sırasında kaymasını veya düşmesini önlemek için sağlam olmaları gerekir.
*   **Isı Büzüşmeli Makaron (Heat Shrink):** Açıkta kalan kabloları ve lehim noktalarını korumak için kullanılır, kısa devreleri ve hasarı önler.
*   **Kablo Bağları (Zip Ties):** Kabloları düzenli tutmak ve bazı bileşenleri sabitlemek için kullanılır.
*   **Buzzer:** Drone'unuzu düşürdüğünüzde bulmanıza yardımcı olan sesli bir alarmdır. Çoğu FC'ye bağlanır.

## Hepsini Bir Araya Getirmek: FPV Donanım Ekosistemi

### Bileşenler Nasıl Birbirine Bağlanır: Bir Kablolama Şemasına Genel Bakış

Tüm bu bileşenler, bir FPV drone'u oluşturmak için dikkatlice birbirine bağlanır. İşte temel bir bağlantı özeti:

1.  **Batarya:** Gücü doğrudan 4'ü 1 arada ESC'ye (veya PDB'ye) sağlar.
2.  **4'ü 1 arada ESC:** Bataryadan gelen gücü alır ve motorlara dağıtır. Ayrıca FC'ye güç (genellikle 5V) ve telemetri bilgisi sağlar.
3.  **Motorlar:** Her motor, 4'ü 1 arada ESC üzerindeki ilgili pedlere lehimlenir.
4.  **Uçuş Kontrol Kartı (FC):** 4'ü 1 arada ESC'den güç alır ve ESC'ye motor kontrol sinyalleri gönderir. Ayrıca alıcıdan (RX) pilot komutlarını alır, VTX'e video ve Smart Audio/Tramp sinyalleri gönderir ve kameradan video sinyalini alır.
5.  **Alıcı (RX):** FC'ye bir UART (seri port) üzerinden bağlanır ve FC'den güç alır. Radyo vericisinden gelen komutları FC'ye iletir.
6.  **FPV Kamera:** FC'ye video sinyali ve güç (genellikle 5V veya 9V) için bağlanır.
7.  **Video Verici (VTX):** FC'ye video sinyali ve Smart Audio/Tramp sinyali için bağlanır ve FC'den veya doğrudan bataryadan güç alır. VTX anteni, VTX'e bağlanır.

Bu, basit bir bağlantı şemasıdır. Her bağlantı, doğru voltaj, sinyal tipi ve genellikle lehimleme becerisi gerektirir.

### Firmware'in Rolü (Betaflight, Emuflight)

Donanım, drone'un vücudu gibiyken, firmware (yazılım), ruhudur. Uçuş kontrol kartı, **Betaflight** veya **Emuflight** gibi açık kaynaklı firmware'ler üzerinde çalışır. Bu firmware'ler:

*   FC'deki sensörlerden veri toplar.
*   Pilotun komutlarını yorumlar.
*   Motorları ve diğer çevre birimlerini kontrol eder.
*   Drone'un dengeli ve pilotun istediği gibi uçmasını sağlamak için sürekli hesaplamalar yapar.

Bu firmware'ler, drone'unuzun davranışını ince ayar yapmak için sayısız yapılandırma seçeneği sunan bir bilgisayar uygulaması (Configurator) aracılığıyla yapılandırılır.

### Drone'un Ötesinde: Gözlükler ve Yer İstasyonu

FPV deneyimini tamamlamak için drone'un kendisinden ayrı iki temel donanım parçasına daha ihtiyacınız var:

*   **FPV Gözlükleri:** VTX'ten gelen video sinyalini alıp size gerçek zamanlı olarak gösteren cihazlardır. Analog (daha düşük çözünürlük, daha az gecikme) ve Dijital (HD çözünürlük, biraz daha fazla gecikme) olmak üzere iki ana türü vardır. **Fat Shark HDO2** (Analog) veya **DJI Goggles 2 / Walksnail Avatar HD Goggles** (Dijital) popüler seçeneklerdir.
*   **Yer İstasyonu (Ground Station):** Çoğu FPV pilotu için sadece gözlükleri yeterlidir. Ancak uzun menzilli veya özel uygulamalar için daha büyük antenler, video kayıt cihazları ve monitörler içeren bir yer istasyonu kurulabilir.

## İlk FPV Donanım Kitiniz: Yeni Başlayanlar İçin Satın Alma Rehberi

### Hazır Uçuş (RTF) vs. Bağla ve Uç (BNF) vs. Kendin Yap (DIY)

FPV'ye başlamak için üç ana yol vardır:

*   **Ready-to-Fly (RTF):** Drone, radyo kumandası ve gözlükler dahil olmak üzere ihtiyacınız olan her şeyi içeren eksiksiz bir pakettir. En kolay başlangıç yoludur ve kutudan çıkar çıkmaz uçmaya başlayabilirsiniz. Öğrenme eğrisi daha düşüktür. **BetaFPV Cetus X Kit** veya **Tinyhawk III RTF Kit** harika başlangıç setleridir.
*   **Bind-and-Fly (BNF):** Drone'un kendisi tamamen monte edilmiş ve yapılandırılmıştır, ancak kendi radyo kumandanız ve gözlüklerinizle eşleştirmeniz (bind) gerekir. RTF'den biraz daha fazla teknik bilgi gerektirir, ancak size radyo ve gözlük seçme esnekliği sunar.
*   **Build-Your-Own (DIY):** Her bir bileşeni ayrı ayrı satın alır, lehimler ve kendiniz monte edersiniz. En karmaşık yol budur ancak FPV drone'unuzu en iyi şekilde anlamanızı, sorun giderme becerileri kazanmanızı ve tam özelleştirme yapmanızı sağlar.

**Yeni Başlayanlar İçin:** Bir RTF kit ile başlamak, FPV'ye sorunsuz bir giriş yapmanızı sağlar. Daha sonra kendi drone'unuzu inşa etme becerilerinizi geliştirebilirsiniz.

### İlk FPV Drone'unuz İçin Bütçe Belirleme

FPV, başlangıçta biraz maliyetli olabilir, ancak uzun vadede çok eğlencelidir. İşte genel bir bütçe beklentisi:

*   **RTF Kitler (Drone, Radyo, Gözlük, Batarya):** 300 - 600 USD (Başlangıç seviyesi)
*   **BNF Drone:** 200 - 450 USD (Ek olarak radyo ve gözlük almanız gerekir)
*   **Kendi Drone'unuzu İnşa Etmek (Sadece Parçalar):** 250 - 600 USD (Ayrıca radyo, gözlük, batarya ve şarj cihazı almanız gerekir)
*   **Radyo Kumandası:** 100 - 300 USD
*   **FPV Gözlükleri:** 150 - 600 USD (Analog) / 400 - 900 USD (Dijital)
*   **Bataryalar ve Şarj Cihazı:** 100 - 250 USD

Unutmayın, bu sadece bir başlangıç ve FPV'ye ne kadar yatırım yapmak istediğinize bağlı olarak maliyetler değişebilir.

### Önerilen Başlangıç Donanım Kombinasyonları

*   **Tiny Whoop (İç Mekan ve Başlangıç):**
    *   **RTF Kit:** BetaFPV Cetus X Kit veya Eachine Novice IV
    *   **Özellikler:** Dayanıklı, küçük, nispeten güvenli, kapalı alanda uçuşa uygun.
*   **5 İnç Freestyle (Dış Mekan ve Gelişmiş):**
    *   **BNF:** iFlight Nazgul5 V3 BNF (kendi radyo ve gözlüğünüzü ekleyin)
    *   **Kendi Yapın:** SpeedyBee F405 V3 Stack (FC+ESC), EMAX Eco II 2207 motorlar, Gemfan 51433 pervaneler, RunCam Phoenix 2 kamera, Rush Tank Mini VTX.

## FPV Donanımı Hakkında Sıkça Sorulan Sorular

### FPV drone inşa etmek için hangi donanımlara ihtiyacım var?

Bir FPV drone inşa etmek için Uçuş Kontrol Kartı (FC), Elektronik Hız Kontrol Cihazları (ESC'ler), Motorlar, Pervaneler, bir FPV Kamera, bir Antenli Video Verici (VTX), bir Alıcı (RX), bir Çerçeve ve bir şarj cihazı ile LiPo Bataryalara ihtiyacınız olacak. Eksiksiz bir deneyim için bir FPV radyo vericisi ve gözlükleri de unutmayın!

### FPV drone bileşenleri birlikte nasıl çalışır?

Uçuş Kontrol Kartı (FC) beyindir ve Alıcı (RX) aracılığıyla Radyo Vericinizden (TX) komutları alır. FC daha sonra ESC'lere sinyaller gönderir, bu da Motorları çalıştırır ve Pervaneleri uçuş için döndürür. FPV Kamera videoyu çeker ve VTX, FPV Gözlüklerinize iletir. Çerçeve, tüm bu bileşenleri bir arada tutar.

### Bir FPV quadcopter'ın temel parçaları nelerdir?

Kesinlikle temel parçalar çerçeve, uçuş kontrol kartı, ESC'ler, motorlar, pervaneler, FPV kamera, VTX, RX ve bir LiPo bataryadır. Bunlardan herhangi biri olmadan quadcopter'ınız uçamaz veya FPV deneyimini sağlayamaz.

### Her FPV drone donanım bileşeninin işlevi nedir?

Her bileşenin belirli bir rolü vardır: FC (stabilizasyon ve kontrol), ESC'ler (motor hız kontrolü), Motorlar (itme kuvveti üretimi), Pervaneler (kaldırma kuvveti), FPV Kamera (video yakalama), VTX (video iletimi), RX (radyo sinyal alımı), Çerçeve (yapısal destek), Batarya (güç kaynağı).

### Farklı markaların FPV donanımlarını karıştırıp eşleştirebilir miyim?

Evet, FPV donanımı büyük ölçüde modülerdir! Farklı markaların bileşenlerini, voltaj, akım değerleri ve iletişim protokolleri (örneğin, FC ve RX protokolleri) açısından uyumlu oldukları sürece karıştırıp eşleştirebilirsiniz. Bu esneklik, FPV drone yapımının temel bir yönüdür.

## Sonuç

FPV donanımının büyüleyici dünyasına derinlemesine bir dalış yaptınız! Beyin gibi çalışan Uçuş Kontrol Kartı'ndan güçlü LiPo bataryalara kadar, her temel bileşenin amacını ve bağlantısını artık anlıyorsunuz. Bu bilgi, FPV drone'unuzu inşa etme, onarma ve gerçekten ustalaşma yolundaki ilk adımdır. Bu bilgiyi eyleme dönüştürmeye hazır mısınız? Başlangıç kitlerini keşfetmeye başlayın, ilk çerçevenizi seçin veya ayrıntılı inşa rehberlerine dalın. Gökyüzü artık bir sınır değil; yeni oyun alanınız. Keyifli uçuşlar!

![FPV image from oscarliang.com](https://oscarliang.com/wp-content/uploads/2013/10/PID-three-algorithms.jpg)
_Source: oscarliang.com_

