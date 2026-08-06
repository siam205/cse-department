import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
const prisma = new PrismaClient();
const BEL = "\x07";

const raw = readFileSync("research-raw.txt", "utf-8");
// Split by BEL and clean each field
const fields = raw.split(BEL).map(s => s.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim());

const AUTHORS_MAP: Record<string,string> = {
  "Prof. Bulbul Ahamed": "Prof. Bulbul Ahamed",
  "Mohammad Naderuzzaman": "Mohammad Naderuzzaman", 
  "Sabrina Tasnim": "Sabrina Tasnim",
  "Mohammad Rashed Hasan Polas": "Mohammad Rashed Hasan Polas",
  "Arifur Rahaman": "Arifur Rahaman",
  "Khadija Islam": "Khadija Islam",
  "Sadia Tasnim Barsha": "Sadia Tasnim Barsha",
  "Salma Tabashum": "Salma Tabashum",
  "Md. Ashfakur Rahman": "Md. Ashfakur Rahman",
  "Abhijit Pathak": "Abhijit Pathak",
  "Zarin Hadika": "Zarin Hadika",
};

// Publisher detection
function pubMatch(s:string):string {
  if(s.toLowerCase().includes("springer")) return "Springer, Singapore";
  if(s.toLowerCase().includes("igi global")) return "IGI Global, USA";
  if(s.match(/\bIEEE\b/)) return "IEEE";
  if(s.toLowerCase().includes("mdpi")) return "MDPI, Switzerland";
  if(s.toLowerCase().includes("emerald")) return "Emerald Publishing Limited, UK";
  if(s.toLowerCase().includes("inderscience")) return "Inderscience, UK";
  if(s.match(/\bSAGE\b/i) || s.includes("Sage Open")) return "SAGE Open";
  if(s.toLowerCase().includes("mecs press")) return "MECS Press";
  if(s.toLowerCase().includes("goodwood")) return "Goodwood Publishing, Indonesia";
  if(s.toLowerCase().includes("zenodo")) return "Zenodo";
  if(s.toLowerCase().includes("ijeast")) return "IJEAST";
  if(s.toLowerCase().includes("bcs admin")) return "BCS Admin Academy, Shahbag, Dhaka";
  if(s.toLowerCase().includes("science publishing")) return "Science Publishing Group (USA)";
  if(s.toLowerCase().includes("cornell")) return "Cornell University, UK";
  if(s.toLowerCase().includes("ijrp")) return "IJRP";
  if(s.toLowerCase().includes("training and research")) return "Training and Research Institute, JIS";
  return "";
}

function getLink(s:string):string { 
  const m=s.match(/https?:\/\/[^\s\]\)>,;]+/); 
  return m?m[0].replace(/[\)\]>,;.!]*$/,""):""; 
}

// Clean title: extract just the paper title from a full citation
const TITLE_MAP: Record<string,string> = {
  "Jamil, M.S.J., Naim, F.A., Ahamed B., Huda, M.N. (2021). Customer Review Analysis by Hybrid Unsupervised Learning Applying Weight on Priority Data. In: Uddin, M.S., Bansal, J.C. (eds) Proceedings of International Joint Conference on Advances in Computational Intelligence. Algorithms for Intelligent Systems. Springer, Singapore. https://doi.org/10.1007/978-981-16-0586-4_27": "Customer Review Analysis by Hybrid Unsupervised Learning Applying Weight on Priority Data",
  "Mohammad Rashed Hasan Polas (Universidad de Lima, Peru), Ratul Kumar Saha (Jahangirnagar University, Bangladesh), and Bulbul Ahamed (Sonargaon University, Bangladesh) Leveraging Green IoT and Blockchain Technology in the Era of Transformative Digitalization: A Green Energy Usage Perspective, Handbook of Research on Social Impacts of E-Payment and Blockchain Technology https://www.igi-global.com/gateway/chapter/293862": "Leveraging Green IoT and Blockchain Technology in the Era of Transformative Digitalization: A Green Energy Usage Perspective",
  "Mohammad Rashed Hasan PolasCorresponding Author; Mosab I. Tabash;Asghar Afshar Jahanshahi; Bulbul Ahamed Consumers' sustainable online purchase behaviour during COVID-19 pandemic: the role of relational benefit and site commitment Available to Purchase https://doi.org/10.1108/FS-01-2021-0012": "Consumers' sustainable online purchase behaviour during COVID-19 pandemic: the role of relational benefit and site commitment",
  "Polas, M. R. H., Ahamed, B., & Rana, M. M. (2023). Artificial intelligence and blockchain technology in the 4.0 IR metaverse Era: Implications, opportunities, and future directions. In Strategies and opportunities for technology in the metaverse world (pp. 13-33). IGI Global. https://www.igi-global.com/chapter/artificial-intelligence-and-blockchain-technology-in-the-40-ir-metaverse-era/315416": "Artificial Intelligence and Blockchain Technology in the 4.0 IR Metaverse Era: Implications, Opportunities, and Future Directions",
  "Polas, M. R. H., Jahanshahi, A. A., Ahamed, B., & Molla, M. O. F. (2023). The future of artificial intelligence in education 4.0: how to go green in the post-COVID-19 context. In Technology management and its social impact on education (pp. 1-20). IGI Global. https://www.igi-global.com/book/technology-management-its-social-impact/317418#table-of-contents": "The Future of Artificial Intelligence in Education 4.0: How to Go Green in the Post-COVID-19 Context",
  "Jalal, M. S., Ahamed, B., Naim, F. A., Das, A., & Huda, M. N. (2023, October). A Novel Approach of Customer Sentiment Analysis by CNN Based on PWWA. In 2023 IEEE 11th Region 10 Humanitarian Technology Conference (R10-HTC) (pp. 301-306). IEEE. https://r10htc2023.org/index.php": "A Novel Approach of Customer Sentiment Analysis by CNN Based on PWWA",
  "Polas, M. R. H., Ahamed, B., & Hanif, M. A., (2023). Barriers to Adoption of e-Governance in the Digital Transformative Era: The Mediating Role of Voluntariness towards Sustainability in Bangladesh. Bangladesh Journal of Administration and Management (BJAM- ISSN-1811-5195), 35(1), 71-92. https://bcsadminacademy.portal.gov.bd/sites/default/files/files/bcsadminacademy.portal.gov.bd/page/d4906f23_541e_4a48_b8ca_7bcf78c7527e/2023-04-02-06-14-3245421cda44f9204a882c856fbab979.pdf": "Barriers to Adoption of e-Governance in the Digital Transformative Era: The Mediating Role of Voluntariness towards Sustainability in Bangladesh",
  "Ahamed, B., Polas, M. R. H., Kabir, A. I., Sohel-Uz-Zaman, A. S. Md., Fahad, A. A., Chowdhury, S., & Rani Dey, M. (2024). Empowering Students for Cybersecurity Awareness Management in the Emerging Digital Era: The Role of Cybersecurity Attitude in the 4.0 Industrial Revolution Era. SAGE Open, 14(1). https://doi.org/10.1177/21582440241228920 https://journals.sagepub.com/doi/full/10.1177/21582440241228920": "Empowering Students for Cybersecurity Awareness Management in the Emerging Digital Era: The Role of Cybersecurity Attitude in the 4.0 Industrial Revolution Era",
  "M. H. Rahman, M. Naderuzzaman, M. A. Kashem, B. M. Salahuddin, and Z. Mahmud, \"Comparative Study: Performance of MVC Frameworks on RDBMS,\" Int. J. Inf. Technol. Comput. Sci., vol. 16, no. 1, pp. 26-34, Feb. 2024. [Online]. Available: https://www.mecs-press.org/ijitcs/ijitcs-v16-n1/IJITCS-V16-N1-3.pdf": "Comparative Study: Performance of MVC Frameworks on RDBMS",
  "Kashem, M. A., Ahmed, M., & Mohammad, N. (2023). Maternal HealthCare Using IoT-Based Integrated Medical Device: Bangladesh Perspective. Journal of Multidisciplinary Academic and Practice Studies, 1(4), 377-391. https://doi.org/10.35912/jomaps.v1i4.1793": "Maternal HealthCare Using IoT-Based Integrated Medical Device: Bangladesh Perspective",
  "Arifuzzaman, S.S Irfan, Sabrina Tasnim, Abdur Rahman, Feeroz Babu (2024). New Techniques To Find The Swift Convergence Using Inertial Extrapolation Scheme In The Cayley Variational Inclusion Problem. Jilin Daxue Xuebao (Gongxueban)/Journal of Jilin U Vol: 43 Issue: 10-2024. https://zenodo.org/records/13986313": "New Techniques To Find The Swift Convergence Using Inertial Extrapolation Scheme In The Cayley Variational Inclusion Problem",
  "Mohammad Rashed Hasan Polas 1,*ORCID,Asghar Afshar Jahanshahi 2ORCID,Ahmed Imran Kabir 3ORCID,Abu Saleh Md. Sohel-Uz-Zaman 3,Abu Rashed Osman 3 andRidoan Karim 4ORCID Artificial Intelligence, Blockchain Technology, and Risk-Taking Behavior in the 4.0IR Metaverse Era: Evidence from Bangladesh-Based SMEs Journal of Open Innovation: Technology, Market, and Complexity https://www.mdpi.com/2199-8531/8/3/168": "Artificial Intelligence, Blockchain Technology, and Risk-Taking Behavior in the 4.0IR Metaverse Era: Evidence from Bangladesh-Based SMEs",
  "Mohammad Rashed Hasan Polas, Mosab I. Tabash, Asghar Afshar Jahanshahi and Valentina Gomes Haensel Schmitt Ethical decision-making practices in SMEs: the role of risk acceptance and confidence level International Journal of Business Governance and Ethics https://www.inderscienceonline.com/doi/abs/10.1504/IJBGE.2022.126172?journalCode=ijbge": "Ethical decision-making practices in SMEs: the role of risk acceptance and confidence level",
  "Adoption of digital banking technologies by nascent entrepreneurs in the era of transformative business information systems International Journal of Business Information Systems Abstract Available at: https://www.inderscience.com/info/ingeneral/forthcoming.php?jcode=ijbis (in press) DOI: 10.1504/IJBIS.2021.10041558": "Adoption of digital banking technologies by nascent entrepreneurs in the era of transformative business information systems",
  "The relationship between street food attributes, tourist attitude and satisfaction towards revisit intention: empirical evidence from Bangladesh International Journal of Productivity and Quality Management Abstract Available at: https://www.inderscience.com/info/ingeneral/forthcoming.php?jcode=ijpqm (in press) DOI: 10.1504/IJPQM.2021.10042105": "The relationship between street food attributes, tourist attitude and satisfaction towards revisit intention: empirical evidence from Bangladesh",
  "Uncovering the Workplace Violence and Intention to Leave Among Women Employees: Evidence from Bangladesh Bangladesh Journal of Administration and Management https://journal.bcsadminacademy.gov.bd/index.php/bjam/article/view/49": "Uncovering the Workplace Violence and Intention to Leave Among Women Employees: Evidence from Bangladesh",
  "Artificial Intelligence and Blockchain Technology in the 4.0IR Metaverse Era: Implications, Opportunities and Future Directions (Book Chapter) Book: Strategies and Opportunities for Technology in the Metaverse World Chapter Approved": "Artificial Intelligence and Blockchain Technology in the 4.0IR Metaverse Era: Implications, Opportunities and Future Directions (Book Chapter)",
  "Hawlader, M. R. ., Rana , M. M. ., Kalam, A. ., & Polas, M. R. H. (2022). Consideration of workers' opinion in the decision-making process in the RMG Sector: Evidence from Bangladesh. Journal of Sustainable Tourism and Entrepreneurship, https://goodwoodpub.com/index.php/JoSTE/article/view/983": "Consideration of workers' opinion in the decision-making process in the RMG Sector: Evidence from Bangladesh",
  "Green Entrepreneurial Intention among Gen Z in Bangladesh: The Mediating Role of Self-Efficacy Proceedings of 2nd IOU Conference on Research and Integrated Sciences (IOUCRIS-2022), August 27, 2022, Gambia Paper Presentation International Open University, Gambia": "Green Entrepreneurial Intention among Gen Z in Bangladesh: The Mediating Role of Self-Efficacy",
  "Green Marketing as a Means of Green Purchase Intention among GEN Z: The Role of Attitude towards Green Environmental Sustainability Proceedings of 5th International e-Conference on Business, Education, and Entrepreneurship (ICBEE-2022), August 31, 2022, Malaysia": "Green Marketing as a Means of Green Purchase Intention among GEN Z: The Role of Attitude towards Green Environmental Sustainability",
  "Arifur Rahaman1, Ratnadip Kuri2 , Syful Islam3 *, Md. Javed Hossain4 , Mohammed Humayun Kabir5 Sarcasm Detection in Tweets: A Feature-based Approach using Supervised Machine Learning Models International Journal of Advanced Computer Science and Applications (IJACSA) https://thesai.org/Publications/ViewPaper?Volume=12&Issue=6&Code=IJACSA&SerialNo=51": "Sarcasm Detection in Tweets: A Feature-based Approach using Supervised Machine Learning Models",
  "Naimul Hasan Shadesh, Arifur Rahaman, Sadia Tasnim Barsha, Salma Tabashum, Sabrina Tasnim (2025). Advanced Face Mask Detection Using Transfer Learning and Custom Classifiers: Enhancing Public Safety Through Computer Vision and Deep Learning. https://doi.org/10.33564/IJEAST.2025.v09i11.001": "Advanced Face Mask Detection Using Transfer Learning and Custom Classifiers: Enhancing Public Safety Through Computer Vision and Deep Learning",
  "Hossain, S., Seyam, T., Chowdhury, A., Ghose, R., Rahaman, A., Hadika, Z., & Pathak, A. (2025). Enhancing Agricultural Diagnostics: Advanced training of Pre-Trained CNN models for paddy leaf disease detection. Machine Learning Research, 10(1), 1-13. https://doi.org/10.11648/j.mlr.20251001.11": "Enhancing Agricultural Diagnostics: Advanced Training of Pre-Trained CNN Models for Paddy Leaf Disease Detection",
  "Hosen, M.B., Farin, N.J., Anannya, M., Islam, K., Uddin, M.S. (2022). Quality Analysis of PATHAO Ride-Sharing Service in Bangladesh. In: Uddin, M.S., Jamwal, P.K., Bansal, J.C. (eds) Proceedings of International Joint Conference on Advances in Computational Intelligence. Algorithms for Intelligent Systems. https://link.springer.com/chapter/10.1007/978-981-19-0332-8_44": "Quality Analysis of PATHAO Ride-Sharing Service in Bangladesh",
  "Islam, K., Polas, M. R. H., Parvin, K., & Akter, T. (2023). Decoding Demographics on Generation Z's Post-Pandemic Shopping Trends: E-Commerce Evolution 4.0, the Digital Shopper's Dilemma, and Tailoring Strategies. International Journal of Business, Management, and Economics, 4(4). pp. 360-380. https://www.researchgate.net/profile/Mohammad-Polas/publication/376207405_Decoding_Demographics_on_Generation_Z's_Post-Pandemic_Shopping_Trends_E-Commerce_Evolution_40_the_Digital_Shopper's_Dilemma_and_Tailoring_Strategies/links/656ecfa0a760eb7cc74e940c/Decoding-Demographics-on-Generation-Zs-Post-Pandemic-Shopping-Trends-E-Commerce-Evolution-40-the-Digital-Shoppers-Dilemma-and-Tailoring-Strategies.pdf": "Decoding Demographics on Generation Z's Post-Pandemic Shopping Trends: E-Commerce Evolution 4.0, the Digital Shopper's Dilemma, and Tailoring Strategies",
  "Sadia Tasnim Barsha (2024). Machine Learning Approaches for Heart Disease Prediction: A Systematic Review and Comparative Analysis. https://doi.org/10.47119/IJRP1001571920247202": "Machine Learning Approaches for Heart Disease Prediction: A Systematic Review and Comparative Analysis",
  "Rohan, M., Khatun, M., Rahman, M., & Pathak, A. (2025). Enhancing flood disaster response through Real-Time monitoring and IoT: the case of SentryLeaf. Internet of Things and Cloud Computing, 13(1), 1-14. https://doi.org/10.11648/j.iotcc.20251301.11": "Enhancing Flood Disaster Response Through Real-Time Monitoring and IoT: The Case of SentryLeaf",
  "Hossain, S., Seyam, T. A., Chowdhury, A., Xamidov, M., Ghose, R., & Pathak, A. (2025). Fine-tuning LLaMA 2 interference: a comparative study of language implementations for optimal efficiency. arXiv (Cornell University). https://doi.org/10.48550/arxiv.2502.01651": "Fine-tuning LLaMA 2 Interference: A Comparative Study of Language Implementations for Optimal Efficiency",
  "Seyam, T., Hossain, M., Ghose, R., Nurmamatov, M., Fayzullo, N., Hadika, Z., & Pathak, A. (2025). Next-Generation K-Means Clustering: Mojo-Driven performance for big data. International Journal of Intelligent Information Systems, 14(1), 7-19. https://doi.org/10.11648/j.ijiis.20251401.12": "Next-Generation K-Means Clustering: Mojo-Driven Performance for Big Data",
};

// Assign papers to correct authors based on docx structure
// Author sections in order from docx
const SECTION_ORDER = [
  { start: "Prof. Bulbul Ahamed", papers: [] as number[] },
  { start: "Mohammad Naderuzzaman", papers: [] as number[] },
  { start: "Sabrina Tasnim", papers: [] as number[] },
  { start: "Mohammad Rashed Hasan Polas", papers: [] as number[] },
  { start: "Arifur Rahaman", papers: [] as number[] },
  { start: "Khadija Islam", papers: [] as number[] },
  { start: "Sadia Tasnim Barsha", papers: [] as number[] },
  { start: "Salma Tabashum", papers: [] as number[] },
  { start: "Md. Ashfakur Rahman", papers: [] as number[] },
  { start: "Abhijit Pathak", papers: [] as number[] },
  { start: "Zarin Hadika", papers: [] as number[] },
];

// Find all publication fields and which section they belong to
let currentSection = -1;
const allPapers: {raw:string, author:string, pubIdx:number}[] = [];

for (let i = 0; i < fields.length; i++) {
  const f = fields[i];
  // Check if this field starts a new author section
  for (let s = 0; s < SECTION_ORDER.length; s++) {
    if (f.toLowerCase().includes(SECTION_ORDER[s].start.toLowerCase()) && f.length < 50) {
      currentSection = s;
      break;
    }
  }
  if (currentSection < 0) continue;
  // Is this a publication line?
  if (f.length < 60) continue;
  if (/^(SCOPUS|Scopus|WoS|N\/A|Indexed|Q\d|IF:|CiteScore|FoSE|CSE|Author\(s\)|Faculty and|Publication Details|Associate|Assistant|Lecturer|Professor|ORCID)/i.test(f)) continue;
  if (!/\d{4}/.test(f) && !/(Book Chapter|Journal|Conference|Proceedings)/i.test(f)) continue;
  
  allPapers.push({raw:f, author:SECTION_ORDER[currentSection].start, pubIdx:i});
}

console.log(`Found ${allPapers.length} papers.`);

type PaperData = {title:string, author:string, link:string, area:string, year:string, pubIdx:number};
const papers: PaperData[] = [];

for (const p of allPapers) {
  // Find publisher by scanning forward
  let area = "";
  for (let j = 1; j <= 5 && p.pubIdx+j < fields.length; j++) {
    area = pubMatch(fields[p.pubIdx+j]);
    if (area) break;
  }
  if (!area) area = pubMatch(p.raw);
  
  const yr = p.raw.match(/\b(20\d{2})\b/);
  
  papers.push({
    title: p.raw,
    author: p.author,
    link: getLink(p.raw),
    area: area || "Sonargaon University",
    year: yr ? yr[1] : "",
    pubIdx: p.pubIdx,
  });
}

// Now map titles using TITLE_MAP (match by raw text first 120 chars)
for (const paper of papers) {
  for (const [key, cleanTitle] of Object.entries(TITLE_MAP)) {
    if (paper.title.substring(0, 40).replace(/\s+/g, "") === key.substring(0, 40).replace(/\s+/g, "")) {
      paper.title = cleanTitle;
      break;
    }
  }
  // If no match in TITLE_MAP, do basic clean
  if (paper.title.length > 150 || paper.title === papers.find(p=>p.title===paper.title)?.title) {
    paper.title = paper.title.replace(/^[A-Z][a-z]+(?:\s+\w\.)+[\s,]*[A-Z][a-z]+.*?\(\d{4}[a-z]?(?:,\s*\w+)?\)\.\s*/,"");
    paper.title = paper.title.replace(/\.\s*(?:Springer|IGI|IEEE|MDPI|Emerald|Inderscience|Sage|MECS|Goodwood|Zenodo|Science Publishing|Cornell|Training|IJEAST|IJRP|BCS).*$/i,"");
  }
}

async function main() {
  await prisma.researchPaper.deleteMany();
  let idx = 1;
  for (const p of papers) {
    const py = parseInt(p.year||"0")||null;
    await prisma.researchPaper.create({
      data: {
        title: p.title,
        authors: p.author,
        area: p.area,
        link: p.link || null,
        date: p.year || "",
        publicationYear: py&&py>=2019?py:null,
        displayOrder: idx++,
      },
    });
  }
  console.log(`Inserted ${idx-1} papers.`);
  const all = await prisma.researchPaper.findMany({select:{title:true,authors:true,area:true}});
  console.log("\nFinal list:");
  all.forEach((p,i) => console.log(`${i+1}. [${p.authors}] "${p.title.substring(0,80)}" | ${p.area}`));
  await prisma.$disconnect();
}
main();
