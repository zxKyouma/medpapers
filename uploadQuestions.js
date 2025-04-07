const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'rendang-table-firebase-adminsdk.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Service account file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rendang-table.firebaseio.com"
});

const db = admin.firestore();
const newQuestions = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));

async function getNextId() {
  const questionsRef = db.collection('questions');
  const snapshot = await questionsRef.orderBy('id', 'desc').limit(1).get();

  if (snapshot.empty) {
    return 'q00001';
  }

  const lastQuestion = snapshot.docs[0].data();
  const lastId = lastQuestion.id; // e.g., "q00005"
  const number = parseInt(lastId.slice(1), 10); // Extract 00005 -> 5
  const nextNumber = number + 1;
  return `q${String(nextNumber).padStart(5, '0')}`; // e.g., "q00006"
}

async function uploadQuestions() {
  const questionsCollection = db.collection('questions');
  
  try {
    let currentNumber = parseInt((await getNextId()).slice(1), 10);

    for (const question of newQuestions) {
      const newId = `q${String(currentNumber).padStart(5, '0')}`;
      
      // Check if this ID already exists to avoid overwrites
      const existingDoc = await questionsCollection.doc(newId).get();
      if (existingDoc.exists) {
        console.log(`Skipping ${newId} - already exists`);
        currentNumber++;
        continue;
      }

      // Set the document ID to match the custom id
      question.id = newId;
      await questionsCollection.doc(newId).set(question);
      console.log(`Added question with ID: ${newId}`);
      currentNumber++;
    }
    console.log('All questions uploaded successfully!');
  } catch (error) {
    console.error('Error uploading questions:', error);
  } finally {
    process.exit(0);
  }
}

uploadQuestions();