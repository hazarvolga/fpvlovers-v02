# No Video in FPV: A Beginner Troubleshooting Checklist

> A symptom-based checklist for the most common FPV problem: the goggles power on, but no usable video appears.

## No Video in FPV: A Beginner Troubleshooting Checklist

# FPV'de Video Yok Sorununa Kesin Çözüm: Adım Adım Tanı ve Onarım Rehberi

FPV uçuşunun heyecanını hiçbir şey, dronunuzu açtığınızda gözlüğünüzde boş, siyah veya statik dolu bir ekranla karşılaşmaktan daha hızlı yok edemez. Uçmaya hazırsınız, ancak dronunuz sizinle konuşmuyor. Panik yapmayın! Bu sadece yaygın bir sorun değil; aynı zamanda çözülebilir bir sorun. Bu nihai FPV video yok sorununa çözüm rehberi, FPV besleme sorunlarınızı tespit etmek ve çözmek için sistematik bir tanı sürecinde size yol gösterecek ve net bir görüşle tekrar havaya dönmenizi sağlayacak.

Ani bir siyah ekranla, kesintili sinyal kaybıyla veya sadece statikle uğraşıyor olun, FPV video sorunlarını gidermek sinir bozucu olabilir. Ancak doğru yaklaşımla ve biraz sabırla, basit yanlış yapılandırmalardan bileşen arızalarına kadar kök nedeni belirleyebilirsiniz. FPV beslemenizi geri yüklemek için net bir yola sahip olmanızı sağlayarak, temel kontrollerden derinlemesine bileşen testlerine kadar her şeyi ele alacağız.

## FPV Video Sisteminizi Anlamak: Sinyal Akışı

Sorun gidermeye başlamadan önce, FPV video sinyalinizin nasıl ilerlediğini anlamak çok önemlidir. Bu, sorunun nerede olabileceğini daraltmanıza yardımcı olacaktır.

### Kameradan Gözlüğe: Yolu Takip Etmek

FPV video sinyalinizin yolculuğu aşağıdaki gibidir:
1.  **Kamera:** Görüntüyü yakalar.
2.  **Uçuş Kontrolcüsü (FC) / OSD:** Kameradan gelen sinyali alır, Üst Ekran Görüntüsü (OSD) verilerini (voltaj, hız vb.) üzerine bindirir ve VTX'e gönderir. Bazı sistemlerde kamera doğrudan VTX'e bağlanır ve OSD devre dışı bırakılır veya VTX'in kendisi OSD'ye sahiptir.
3.  **Video Vericisi (VTX):** Gelen video sinyalini alır ve radyo frekansı (RF) sinyaline dönüştürerek anten aracılığıyla yayınlar.
4.  **Drone Anteni:** VTX'ten gelen RF sinyalini havaya yayar.
5.  **Gözlük/Yer İstasyonu Anteni:** Drone'dan gelen RF sinyalini alır.
6.  **Gözlük Alıcısı (RX):** Antenden gelen RF sinyalini tekrar video sinyaline dönüştürür.
7.  **Gözlük Ekranı:** Video sinyalini görüntüler.

Bu zincirdeki herhangi bir kopukluk, "video yok" sorununa neden olabilir.

### Anahtar Bileşenler: Kamera, FC (OSD), VTX, Anten

Her kritik bileşenin video zincirindeki rolüne kısa bir genel bakış:

*   **FPV Kamera:** Görüntüyü yakalayan sensör. Genellikle 5V veya 12V ile çalışır. Örnekler arasında **RunCam Phoenix 2**, **Foxeer Predator** veya **Caddx Ratel 2** gibi popüler analog kameralar bulunur. Dijital sistemlerde ise **DJI O3 Air Unit Kamera** veya **Walksnail Avatar Kamera** gibi entegre kameralar vardır.
*   **Uçuş Kontrolcüsü (FC) ve OSD:** Modern FC'ler (örn. **Kakute F7**, **SpeedyBee F405 V3**) genellikle bir OSD yongası (örn. MAX7456) içerir. Bu, uçuş verilerini doğrudan video beslemesine bindirir. Kameradan gelen sinyal FC'ye girer, OSD bilgisi eklenir ve ardından VTX'e çıkar.
*   **Video Vericisi (VTX):** Video sinyalini havadan ileten cihaz. Güç çıkışı (mW) ve kanallar açısından değişir. Popüler analog VTX'ler arasında **TBS Unify Pro32** ve **Rush Tank Mini** bulunur. Dijital sistemlerde ise **DJI O3 Air Unit**, **Walksnail Avatar HD Mini Kit** veya **HDZero Freestyle V2 VTX** gibi entegre hava üniteleri bulunur.
*   **Anten:** RF sinyalini yayınlamak ve almak için VTX ve gözlükler için gereklidir. Doğru polarizasyon ve frekans önemlidir. **Lumenier AXII** veya **Foxeer Lollipop** gibi dairesel polarize antenler yaygın olarak kullanılır.

### Analog ve Dijital FPV Sistemleri: Temel Farklılıklar

Video yok sorunu aynı olsa da, sorun giderme adımları analog ve dijital sistemler arasında önemli ölçüde farklılık gösterebilir:

*   **Analog Sistemler (örn. Fat Shark, Eachine):** Genellikle siyah ekran veya yoğun statik ile karşılaşılır. Sinyal kalitesi zayıfsa karıncalanma veya renk bozulması görülür. Sorunlar genellikle frekans eşleşmesi, kablolama veya bileşen arızasından kaynaklanır.
*   **Dijital Sistemler (örn. DJI FPV, Walksnail, HDZero):** Genellikle tamamen siyah bir ekran veya "Sinyal Yok" mesajı gösterir. Bazen pikselleşme veya çerçeve düşüşleri görülür. Bu sistemler eşleştirme, firmware uyumluluğu ve veri bağlantısı sorunlarına daha yatkındır.

## İlk Savunma Hattı: Temel Kontroller ve Yaygın Gözden Kaçanlar

Sorun gidermeye başlarken, en basit ve en yaygın sorunları kontrol ederek başlayın. Şaşırtıcı derecede sık, çözüm bu temel adımlarda yatar.

### Doğru Şekilde Güç Verme: Batarya ve Kurulum

*   **Drone Bataryası:** Drone'nuzun doğru şekilde ve tamamen güç aldığından emin olun. Batarya voltajınızın yeterli olduğundan ve bağlantının sağlam olduğundan emin olun.
*   **VTX Güçlendirme Gecikmesi:** Bazı VTX sistemleri, özellikle yüksek güç çıkışlı olanlar, dron kollandığında veya belirli bir gecikmeden sonra tam güçte iletim yapmaya başlar. VTX'inizin üzerindeki durum LED'lerini kontrol edin.

### Gözlük ve Alıcı Kontrolü: Güç, Kanal, Giriş

*   **Gözlük Gücü:** Gözlüğünüz açık mı? Bataryası şarjlı mı?
*   **Giriş Kaynağı:** Doğru giriş kaynağını mı seçtiniz (örn. dahili alıcı, AV girişi)?
*   **Analog Alıcı Modülü:** Analog için, alıcı modülü (örn. **ImmersionRC RapidFire**, **TBS Fusion**) doğru şekilde takılı ve güç alıyor mu?
*   **Kanal ve Band Eşleşmesi:** Gözlüğünüzdeki kanal ve bandın dronunuzun VTX'iyle tam olarak eşleştiğinden emin olun. Bu, en yaygın "video yok" nedenidir.

### Anten Bütünlüğü: Sağlam ve Hasarsız

*   **Drone Anteni:** Drone'nuzdaki (VTX) antenin sağlam bir şekilde takılı olduğundan, bükülmediğinden, ezilmediğinden veya koruyucu kapağının eksik olmadığından emin olun.
*   **Gözlük Antenleri:** Gözlüğünüzdeki/alıcınızdaki antenleri de kontrol edin. Hasarlı veya eksik bir anten, anında sinyal kaybına veya hatta VTX hasarına yol açabilir (anten olmadan VTX'i asla çalıştırmayın!).

### Kanal ve Band Eşleşmesi: En Basit Çözüm

"Video yok" için en yaygın suçlu, yanlış frekansta olmaktır. Gözlüğünüzün/alıcınızın VTX'inizle tam olarak aynı kanala ve banda ayarlandığını iki kez kontrol edin. Emin değilseniz kanallar arasında manuel olarak geçiş yapın, özellikle siyah ekran yerine statik görüyorsanız. **Betaflight OSD** üzerinden VTX ayarlarınızı kontrol etmek için dronunuzu kollandırmadan önce menüye erişin.

## FPV Kameranızı Teşhis Etme: Bir Şey Görüyor mu?

Temel kontrollerden sonra hala siyah ekranla karşılaşıyorsanız, sıradaki adım FPV kameranızı incelemektir.

### Kameraya Güç: Voltaj Kontrolü

*   **Multimetre Kullanımı:** Kameranın çalışması için güce ihtiyacı vardır. Bir multimetre kullanarak FPV kameranıza sağlanan voltajı kontrol edin. Çoğu kamera 5V veya 12V ile çalışır. Kameranın güç giriş pedlerine doğru voltajın ulaştığını doğrulayın. Örneğin, **RunCam Nano 3** genellikle 5V ile çalışır.
*   **Kablolama Kontrolü:** Güç kablolarının (VCC ve GND) kameraya sağlam bir şekilde bağlı olduğundan emin olun.

### Sinyal Çıkış Testi: Gözlüğe Doğrudan Bağlantı

*   **Bypass Yöntemi:** Geçici olarak VTX ve FC'yi atlayın. Mümkünse, FPV kameranızın video çıkışını doğrudan gözlüğünüzün veya bir monitörün analog video girişine (AV IN) bağlayın.
    *   **Nasıl Yapılır:** Kameraya 5V veya 12V güç verin (uygun bir bench güç kaynağı veya küçük bir batarya ile). Kameranın video çıkış kablosunu gözlüğünüzün AV IN portuna bağlayın.
*   **Sonuç:** Bir görüntü alırsanız, kameranız muhtemelen çalışıyordur ve sorun zincirin daha aşağısındadır. Eğer hala siyah ekran varsa, kamera arızalıdır.

### Fiziksel Hasar ve Lens Sorunları

*   **Görsel İnceleme:** Kamerayı çatlak lens, kırık teller veya PCB'ye darbe hasarı gibi herhangi bir gözle görülür hasar açısından inceleyin.
*   **Lens Odaklama:** Gevşek bir lens bile bulanık veya bozuk bir görüntüye neden olabilir, bu da video yok olarak yanlış anlaşılabilir. Lensi sıkın ve odaklandığından emin olun.

### Firmware ve Ayarlar (Dijital Sistemler)

*   **Dijital Kameralar:** Dijital FPV kameralar (örn. **DJI O3 Air Unit**, **Caddx Vista**), sisteminizle uyumlu firmware'e ve doğru yapılandırılmış ayarlara (örn. çözünürlük, kare hızı) sahip olmalıdır. Bu ayarlar genellikle OSD aracılığıyla veya özel bir konfigüratör yazılımı (örn. DJI Assistant 2) aracılığıyla yapılır.

## Video Vericisini (VTX) Sorun Giderme: Yayın Merkezi

Kamera sağlam görünüyorsa, bir sonraki adım video vericisidir.

### VTX Güç ve Isı Kontrolü: Canlı mı?

*   **Güç Kontrolü:** VTX'inizin güç aldığını doğrulayın. Birçok VTX'in gösterge LED'leri bulunur. Yanmıyorsa veya alışılmadık derecede soğuksa, güç almıyor olabilir.
*   **Aşırı Isınma:** Tersine, iletim yapmadan aşırı ısınan bir VTX, kısa devre veya dahili bir arızayı gösterebilir. Bu kontrolü her zaman kısa süreli güç vererek yapın ve **DUMMY LOAD** kullanıyorsanız daha uzun sürebilir.
*   **Smoke Stopper:** Onarımlardan sonra ilk güç açılışlarında bir **smoke stopper** kullanmak, hala bir kısa devre varsa daha fazla hasarı önlemek için hayati öneme sahiptir.

### Kanal ve Güç Çıkışı Yapılandırması (SmartAudio/TrampHV)

*   **Protokol Ayarları:** Modern VTX'ler, uçuş kontrolcünüzün OSD'si veya **Betaflight Configurator** aracılığıyla **SmartAudio** veya **TrampHV** protokolleri üzerinden yapılandırılır. VTX'in doğru banda, kanala ve güç seviyesine ayarlandığından emin olun.
*   **Pit Modu:** Yanlışlıkla etkinleştirilmiş 'Pit Modu'nu kontrol edin. Bu mod, iletim gücünü çok düşük bir seviyeye sınırlar, sanki sinyal yokmuş gibi görünmesine neden olabilir. Örneğin, **TBS Unify Pro32 Nano** VTX'lerde bu ayar kolayca gözden kaçabilir.

### VTX Anten Bağlantısı ve Hasarı

*   **Kritik Bağlantı:** VTX ile anteni arasındaki bağlantı kritiktir. Gevşek veya hasarlı bir anten konektörü (**MMCX**, **UFL**, **SMA**) ciddi sinyal bozulmasına veya tamamen siyah bir ekrana neden olabilir.
*   **Asla Antensiz Çalıştırmayın:** Bir VTX'i asla anten takılı olmadan çalıştırmayın, bu onu kalıcı olarak hasar verebilir.

### VTX Pit Modu ve Aşırı Isınma Koruması

*   **Pit Modu:** Daha önce belirtildiği gibi, bazı VTX'lerin 'Pit Modu' vardır ve çok düşük güçte iletim yapar, bu da sinyal yokmuş gibi görünmesine neden olur.
*   **Termal Koruma:** VTX'ler aşırı ısınırsa termal koruma moduna girebilir, bu da soğuyana kadar iletimi azaltır veya tamamen keser. Yeterli hava akışını sağlayın.

## Kablolama, Bağlantılar ve OSD Entegrasyonunu Araştırma: Gizli Suçlular

Kamera ve VTX sağlam görünüyorsa, sorun kablolama, bağlantılar veya uçuş kontrolcüsündeki OSD entegrasyonunda olabilir.

### Tüm Kabloları İnceleme: Lehim Bağlantıları ve Kopukluklar

*   **Görsel İnceleme:** FPV sistemiyle ilgili tüm kabloları görsel olarak inceleyin: kameradan FC'ye, FC'den VTX'e ve VTX güç kabloları.
*   **Kötü Lehimler:** Aşınmış kablolar, soğuk lehim bağlantıları veya tamamen kopukluklar arayın. Gevşek bağlantıları kontrol etmek için kabloları yavaşça çekin. Özellikle titreşimli ortamlarda çalışan dronlarda bu tür sorunlar sıkça görülür.

### Uçuş Kontrolcüsü (FC) OSD Sorunları: Betaflight/iNav Ayarları

*   **OSD Olmaması/Bozukluğu:** Video beslemeniz varsa ancak OSD eksikse veya bozuksa, sorun FC'nizin OSD yongasında veya yapılandırmasında olabilir.
*   **Betaflight/iNav OSD Sekmesi:** **Betaflight** veya **iNav** OSD sekmesi ayarlarını kontrol edin, OSD'nin etkinleştirildiğinden ve elemanların görüntüleme alanında olduğundan emin olun.
*   **Siyah Ekran Nedeni:** Bazen, tam bir siyah ekran, FC'nin video sinyalini OSD yongası aracılığıyla geçirmemesinden kaynaklanabilir. FC'deki bir arıza veya yanlış bir ayar bu duruma yol açabilir.

### Topraklama ve Elektriksel Gürültü Sorunları

*   **Ortak Toprak:** Yanlış topraklama (örn. kamera/VTX için ayrı topraklar) gürültü, statik veya hatta siyah bir ekran oluşturabilir. Tüm bileşenlerin ortak bir toprağı paylaştığından emin olun.
*   **Elektriksel Gürültü:** Motorlardan veya ESC'lerden gelen elektriksel gürültü de video sinyaline müdahale edebilir, bazen tamamen kayba neden olabilir. **LC filtreleri** bu tür gürültüyü azaltmaya yardımcı olabilir.

### Video Sinyal Hattı Süreklilik Testi

*   **Multimetre Kullanımı:** Bir multimetreyi süreklilik modunda kullanarak, kameranın çıkışından VTX'in girişine (genellikle FC'den geçerek) video sinyal hattını test edin. Bu, sinyal yolunun kopuk olmadığını doğrular.
*   **Arızalı İz/Kablo:** FC üzerindeki kırık bir video izi veya arızalı bir kablo, herhangi bir sinyali engelleyecektir.

## Drone'dan Ötesi: Gözlük ve Alıcı Derinlemesine İnceleme

Drone'nuzdaki her şeyi kontrol ettikten sonra, hala sorun yaşıyorsanız, sorunun gözlüğünüzde veya alıcınızda olma ihtimali vardır.

### Gözlük Gücü ve Giriş Kaynağı

*   **Güç ve Şarj:** Gözlüğünüzün tamamen şarj olduğundan veya yeterli güç aldığından emin olun.
*   **Doğru Giriş:** Gözlüğünüzde birden fazla seçenek varsa doğru video giriş kaynağını (örn. dahili alıcı, HDMI, AV IN) seçtiğinizden emin olun.

### Alıcı Modülü İşlevselliği (Analog)

*   **Modül Kontrolü:** Modüler analog gözlükler için, alıcı modülünü yeniden takmayı deneyin. Yedek bir modülünüz varsa, modülün kendisinin arızalı olup olmadığını test etmek için değiştirin.
*   **Firmware Güncellemesi:** Uygulanabiliyorsa, modülün firmware'inin güncel olduğundan emin olun (örn. **ImmersionRC RapidFire** veya **TBS Fusion** modülleri için).

### Dijital Sistem Eşleştirme ve Firmware

*   **Eşleştirme:** Dijital FPV sistemleri için, gözlüğünüzün/hava ünitenizin doğru şekilde eşleştirildiğinden emin olun. Örneğin, **DJI FPV Sistemi** veya **Walksnail Avatar HD** sistemlerinde eşleştirme prosedürünü tekrar gözden geçirin.
*   **Firmware Uyumluluğu:** Hava ünitesi ve gözlükler arasındaki firmware uyumluluk sorunlarını kontrol edin ve gerekirse güncelleyin. Bir uyumsuzluk video iletimini veya görüntülenmesini engelleyebilir.

### Gözlük Üzerindeki Anten Kalitesi ve Yerleşimi

*   **Anten Kontrolü:** Drone'nun anteni gibi, gözlük antenleriniz de çok önemlidir. Doğru şekilde yönlendirildiklerinden (örn. doğrusal için dikey, dairesel için eşleşen polarizasyon) ve hasarsız olduklarından emin olun.
*   **Yedek Anten:** Bilinen iyi antenlerle değiştirmeyi deneyin. **Patch antenler** ve **Omni antenler** gibi farklı tiplerin performansını karşılaştırın.

## FPV Video Yok Tanısı İçin Temel Araçlar

Sorun giderme sürecini kolaylaştırmak için elinizde bazı önemli araçlar bulunmalıdır.

### Multimetre ve Smoke Stopper: En İyi Dostlarınız

*   **Multimetre:** Voltajları, sürekliliği kontrol etmek ve kısa devreleri belirlemek için iyi bir dijital multimetre vazgeçilmezdir.
*   **Smoke Stopper:** Onarımlardan sonra ilk güç açılışlarında bir **smoke stopper** kullanmak, hala bir kısa devre varsa daha fazla hasarı önlemek için hayati öneme sahiptir.

### Lehim Havya ve Isı Büzüşmeli Makaron: Onarımlar İçin

*   **Lehimleme Ekipmanı:** İnce uçlu güvenilir bir lehim havya, lehim ve ısı büzüşmeli makaron, kırık telleri onarmak veya arızalı bileşenleri değiştirmek için gereklidir. İyi lehimleme becerileri FPV'de büyük bir avantajdır.

### Yedek Parçalar: Kamera, VTX, Antenler

*   **Hızlı Teşhis:** Elinizde yedek FPV kameralar, VTX'ler ve antenler bulunması, sorunu izole etmek için hızlı bileşen değişimine olanak tanır. Bu, önemli ölçüde tanı süresi kazandırabilir.

### FPV Bench Güç Kaynağı ve USB Kablosu

*   **Güvenli Test:** Özel bir bench güç kaynağı, tüm dronunuzu riske atmadan tek tek bileşenlere güvenli bir şekilde güç sağlayarak test etmenizi sağlar.
*   **FC Yapılandırması:** Uçuş kontrolcünüzü **Betaflight** veya **iNav Configurator**'a bağlamak için bir USB kablosu gereklidir.

## FPV Video Kaybı Hakkında Sıkça Sorulan Sorular

### FPV kameram neden siyah ekran gösteriyor?
Siyah ekran genellikle video sinyalinin tamamen kaybolduğunu gösterir. Yaygın nedenler arasında kameraya veya VTX'e güç gelmemesi, kopuk bir video sinyal kablosu, arızalı bir kamera veya VTX veya gözlüğünüzde yanlış kanal/band ayarları bulunur. Ayrıca hasarlı bir anten veya uçuş kontrolcünüzün OSD yongasıyla ilgili bir sorun da olabilir.

### FPV kameramı veya VTX'imi bir drone olmadan nasıl test edebilirim?
Bir kamerayı test etmek için, 5V/12V'luk bir bench güç kaynağı ile güç verebilir ve video çıkışını doğrudan FPV gözlüğünüzün veya bir monitörün AV girişine bağlayabilirsiniz. Bir VTX için, güç verin (anten takılıyken!) ve gözlüğünüzü kullanarak sinyal iletip iletmediğini görmek için kanalları tarayın (kamera takılı olmasa bile sadece statik olsa bile).

### Kesintili FPV videonun yaygın nedenleri nelerdir?
Kesintili video genellikle gevşek bağlantılar, soğuk lehim bağlantıları, hasarlı antenler, aşırı ısınan VTX veya elektriksel gürültü parazitini işaret eder. Ayrıca bazen çalışan, bazen çalışmayan arızalı bir bileşenin belirtisi de olabilir.

### Kötü bir anten siyah ekrana neden olabilir mi?
Evet, VTX veya gözlüklerde ciddi şekilde hasar görmüş veya bağlantısı kesilmiş bir anten, sinyal etkili bir şekilde iletilemediği veya alınamadığı için kesinlikle tamamen siyah bir ekrana neden olabilir. Her zaman önce anten bütünlüğünü kontrol edin.

### Bozuk bir VTX'i tamir etmek mümkün mü?
Gevşek bir anten konektörü gibi bazı küçük sorunlar dikkatli lehimleme ile onarılabilirken, bir VTX PCB'deki dahili bileşen arızalarını çoğu hobi sahibi için onarmak genellikle zor ve maliyetli değildir. Genellikle arızalı bir VTX'i değiştirmek daha pratiktir.

## Sonuç

Bir FPV siyah ekranıyla karşılaşmak inanılmaz derecede sinir bozucu olabilir, ancak bu rehberin gösterdiği gibi, çoğu sorun sistematik bir yaklaşımla çözülebilir. FPV video zincirindeki her bileşeni – kameradan VTX'e, kablolamadan gözlüğünüze kadar – metodik olarak kontrol ederek, sorunu tespit edebilir ve dronunuzu tekrar havaya döndürebilirsiniz.

"Video yok" sorununa kalıcı olarak takılıp kalmayın! Bu adımları izleyin, önerilen araçları kullanın ve FPV beslemenizi geri yükleyin. FPV video sorununuz için benzersiz bir çözüm buldunuz mu? İçgörülerinizi aşağıdaki yorumlarda paylaşın! Bir bileşeni yükseltmeye veya değiştirmeye hazır mısınız? Piyasadaki en iyi kameralar, VTX'ler ve antenler için önerilen FPV ekipman rehberlerimize göz atın!


---

_Schema generated_
_Affiliate analysis generated_
_SEO research generated_
