import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

const IELTS_TOPICS = {
  Technology: [
    "Some people think that technology has made our lives more complex. To what extent do you agree or disagree?",
    "The internet has transformed the way people communicate. Discuss the advantages and disadvantages of this development.",
    "Artificial intelligence will soon replace human workers in many industries. Do you think this is a positive or negative development?",
    "Social media has had a largely negative impact on both individuals and society. To what extent do you agree or disagree?",
    "Some people believe that smartphones have made people less sociable. Others disagree. Discuss both views and give your own opinion.",
    "Technology is making people more isolated from each other. To what extent do you agree?",
    "Online shopping is replacing traditional shopping. Is this a positive or negative development?",
    "Some people think governments should invest in technology rather than arts. Do you agree or disagree?",
    "The use of social media is replacing face-to-face interaction. To what extent is this a positive or negative development?",
    "Computers and robots are increasingly being used to do work that was previously done by humans. Is this a positive or negative development?",
  ],
  Environment: [
    "Many species of plants and animals are becoming extinct. Some people say we should protect them while others say we have more important problems. Discuss both views.",
    "Climate change is the biggest threat facing the world today. To what extent do you agree or disagree?",
    "Governments should make it illegal for people to throw away food. To what extent do you agree or disagree?",
    "Some people think that individuals can do little to improve the environment. Only governments and large companies can make a difference. Do you agree or disagree?",
    "Increasing the price of petrol is the best way to solve growing traffic and pollution problems. To what extent do you agree?",
    "The world's natural resources are consumed at an ever-increasing rate. What are the causes and what are the solutions?",
    "More and more wild animals are on the verge of extinction. What are the causes and what can be done to address this problem?",
    "Some people think that environmental problems should be solved on a global scale, while others believe they should be dealt with by individual countries. Discuss both views.",
    "Plastic waste is a major environmental problem. What are the causes and what solutions can be suggested?",
    "Renewable energy is the solution to the world's energy problems. To what extent do you agree or disagree?",
  ],
  Education: [
    "Some people think that university education should be free for all students. Others believe students should pay for their tuition. Discuss both views and give your opinion.",
    "Children should be taught how to manage money at school. To what extent do you agree or disagree?",
    "Many schools are replacing traditional textbooks with tablets and laptops. What are the advantages and disadvantages of this development?",
    "Some people believe that studying abroad has great benefits for students. Others think it creates problems. Discuss both views.",
    "Gap years between school and university are becoming more popular. Are they a positive or negative development?",
    "Single-sex schools produce better academic results than mixed schools. To what extent do you agree or disagree?",
    "Universities should accept equal numbers of male and female students in all subjects. To what extent do you agree or disagree?",
    "Some people think homework should be banned. Others think it is essential. Discuss both views and give your opinion.",
    "Online learning will eventually replace classroom learning. Do you think this is a positive or negative development?",
    "Children who grow up in poor families face more challenges in education. What are the main problems and what can be done to solve them?",
    "Some people think that teachers should be responsible for teaching students how to be good citizens. Others think this is the role of parents. Discuss both views.",
    "Private schools have a negative effect on society. To what extent do you agree or disagree?",
  ],
  Health: [
    "Some people think that the best way to improve public health is to increase the number of sports facilities. Others think this will have little effect. Discuss both views.",
    "Governments should ban all forms of advertising for unhealthy foods and drinks. To what extent do you agree or disagree?",
    "The number of people choosing to have plastic surgery is increasing. Why do you think this is happening? Is this a positive or negative development?",
    "Mental health problems are increasing in modern society. What are the causes and what can be done to address this problem?",
    "Some people think that instead of preventing climate change, we should find a way to live with it. To what extent do you agree?",
    "Fast food is becoming increasingly popular around the world. Some people see this as a problem. To what extent do you agree or disagree?",
    "The ageing population in many countries is creating serious problems for governments. What are the causes and solutions?",
    "Some people think that healthcare should be free for everyone. Others disagree. Discuss both views and give your opinion.",
    "Stress is now a major problem in many countries. What are the causes of this and what can be done to tackle this problem?",
    "People are living longer than ever before. What are the advantages and disadvantages of this trend?",
  ],
  Society: [
    "In many countries, the gap between the rich and the poor is increasing. What are the causes and what solutions can you suggest?",
    "Crime rates are increasing in many parts of the world. What are the causes of crime and what can be done to prevent it?",
    "Immigration has a positive impact on the countries that receive immigrants. To what extent do you agree or disagree?",
    "Some people think that men and women should have equal rights in all situations. Others think there should be differences. Discuss both views.",
    "Volunteering should be made compulsory for young people. To what extent do you agree or disagree?",
    "Some people think older people should live with their adult children. Others believe they should live in care homes. Discuss both views.",
    "In many cities, the amount of traffic is increasing. What are the causes and solutions to this problem?",
    "Some people think that women should not work if they have young children. Do you agree or disagree?",
    "Capital punishment should be abolished in all countries. To what extent do you agree or disagree?",
    "Many people prefer to watch sports on television rather than attend live events. Why is this and is it a positive or negative development?",
    "Some people think that the best way to reduce crime is to give longer prison sentences. Others think there are better ways. Discuss both views.",
    "The family is the most important influence on young adults. To what extent do you agree or disagree?",
  ],
  Economy: [
    "Some people think economic growth is the only way to end poverty and hunger. Others think economic growth is causing environmental damage. Discuss both views.",
    "Governments should spend more money on public services rather than on arts and culture. To what extent do you agree or disagree?",
    "Some people think that in order to prevent illness and disease, governments should make efforts in reducing environmental pollution and housing problems. To what extent do you agree or disagree?",
    "Many businesses now operate internationally. What are the advantages and disadvantages of this development?",
    "Tourism has brought great benefits to many places. At the same time, it has caused serious problems. To what extent do the problems outweigh the benefits?",
    "Some people think that developing countries should invite large foreign companies to help their economies. Others think this is a negative development. Discuss both views.",
    "The gap between rich and poor countries is widening. What problems does this cause and how can this situation be improved?",
    "Governments should spend money on railways rather than on roads. To what extent do you agree or disagree?",
    "Free trade between countries benefits both producers and consumers. To what extent do you agree or disagree?",
    "Some people think that money is the most important factor in achieving happiness. To what extent do you agree or disagree?",
  ],
  Science: [
    "Scientists predict that in the future computers will be more intelligent than humans. Some think this will be beneficial while others think it will be dangerous. Discuss both views.",
    "Space exploration is a waste of money. To what extent do you agree or disagree?",
    "Some people think genetic engineering is an important scientific development. Others feel it is dangerous and should be stopped. Discuss both views.",
    "Scientists and the news media are presenting conflicting information about the effect of diet and exercise on health. What are the causes and what are the solutions?",
    "Medical advances are increasing the cost of healthcare. To what extent do you agree or disagree that this is a problem?",
    "Some people think that cloning animals is ethically wrong and should be banned. Others think cloning has benefits. Discuss both views.",
    "Nuclear technology should be used only for peaceful purposes. To what extent do you agree or disagree?",
    "Scientific research should be funded by governments rather than private companies. To what extent do you agree or disagree?",
  ],
  Culture: [
    "Some people think that it is important to preserve traditional customs and culture. Others think that change is always positive. Discuss both views.",
    "International tourism has brought great benefits to many places. What are the advantages and disadvantages of international tourism?",
    "Many young people today prefer watching foreign films to films made in their own country. Why is this? Is it a positive or negative development?",
    "Some people think that a country's national identity is lost when too many foreigners settle there. To what extent do you agree or disagree?",
    "Younger generations are increasingly losing touch with their cultural heritage. What are the causes and what can be done about it?",
    "Some people think that art is an essential part of society, while others think it is a waste of resources. Discuss both views.",
    "Watching television is bad for children. To what extent do you agree or disagree?",
    "Some people think that learning a foreign language is important. Others think it is becoming less important. Discuss both views.",
  ],
  Globalisation: [
    "Globalisation has had a largely positive effect on the world. To what extent do you agree or disagree?",
    "Some people think that English will remain the most important world language in the future. Others think it will be replaced by another language. Discuss both views.",
    "The world would be a safer place if more countries had nuclear weapons. To what extent do you agree or disagree?",
    "Some people think that it is better to live in a country where there is a large number of immigrants. Others disagree. Discuss both views.",
    "Multinational corporations are having a negative effect on local businesses. To what extent do you agree or disagree?",
    "Some people think that the media, including TV and newspapers, have too much influence on people's lives. To what extent do you agree or disagree?",
    "International aid does not solve poverty problems. To what extent do you agree or disagree?",
  ],
  Media: [
    "The media has too much influence on people's opinions and decisions. To what extent do you agree or disagree?",
    "Newspapers are becoming less popular and will soon disappear. Is this a positive or negative development?",
    "Freedom of the press is essential in a democratic society. To what extent do you agree or disagree?",
    "Advertising encourages people to buy things they do not need. To what extent do you agree or disagree?",
    "Some people think that violent video games cause violence in society. Others disagree. Discuss both views.",
    "Social media influencers have more impact on young people than traditional celebrities. To what extent do you agree or disagree?",
    "The rise of fake news is one of the biggest threats to democracy today. To what extent do you agree or disagree?",
  ],
  Politics: [
    "Voting should be made compulsory in all democratic countries. To what extent do you agree or disagree?",
    "Politicians should be honest with the public at all times. To what extent do you agree or disagree?",
    "Some people think that governments should control the internet. Others think the internet should remain free. Discuss both views.",
    "Developed countries have a greater responsibility to combat climate change than developing countries. To what extent do you agree or disagree?",
    "Some people believe that the government should provide financial assistance to all artists. Others think that artists should find other ways of making money. Discuss both views.",
    "Some people think that governments should ban dangerous sports and activities. Others think people should have the freedom to choose. Discuss both views.",
  ],
  Transport: [
    "Some people think that the best way to solve traffic congestion is to build more roads. Others think there are better solutions. Discuss both views.",
    "Cycling is a better form of transport than driving in cities. To what extent do you agree or disagree?",
    "Car ownership is increasing rapidly around the world. What problems does this cause and what solutions can you suggest?",
    "Some people think that public transport should be free for everyone. Others disagree. Discuss both views.",
    "High-speed rail should replace air travel for short distances. To what extent do you agree or disagree?",
  ],
}

export async function POST(req) {
  try {
    const { level, taskType, difficulty, category } = await req.json()

    const diffMap = {
      easy: 'Familiar everyday topics. Use simple vocabulary appropriate for this level.',
      medium: 'Moderately complex topics. Use varied vocabulary and sentence structures.',
      hard: 'Abstract and complex topics. Use sophisticated vocabulary and arguments.',
    }
    const structures = {
      'Task 1 Academic': ['Introduction: Paraphrase what the graph shows','Overview: 2 main trends (no data yet)','Body 1: Key features with specific data','Body 2: Compare or contrast secondary features'],
      'Task 1 General': ['Opening: State purpose and relationship to recipient','Para 1: First bullet point','Para 2: Second bullet point','Para 3: Third bullet point','Closing: Appropriate sign-off'],
      'Task 2': ['Introduction: Paraphrase + clear thesis','Body 1: First argument + example','Body 2: Second argument + example','Body 3 (optional): Counter-argument','Conclusion: Summarise, no new ideas'],
    }

    const task = taskType || 'Task 2'
    const diff = difficulty || 'medium'
    const cat = category || 'Technology'

    // Pick random topics from the bank for this category
    const topicBank = IELTS_TOPICS[cat] || IELTS_TOPICS['Technology']
    const shuffled = [...topicBank].sort(() => Math.random() - 0.5)
    const sampleTopics = shuffled.slice(0, 5).map((t, i) => `${i+1}. ${t}`).join('\n')

    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `You are an IELTS examiner. Generate one original writing task.

Here are some real IELTS questions from the past 5 years for reference and inspiration:
${sampleTopics}

Level: ${level}
Task type: ${task}
Category: ${cat}
Difficulty: ${diff} — ${diffMap[diff]}

Using the above as inspiration, generate ONE new original IELTS-style ${task} question. 
- It should be similar in style and difficulty to the examples
- Make it feel current and relevant to today's world
- Do NOT copy the examples word for word

Return ONLY a valid JSON object. No markdown, no backticks, no extra text:
{"taskType":"${task}","category":"${cat}","difficulty":"${diff}","question":"full question exactly as it would appear on the IELTS exam","visualDescription":${task === 'Task 1 Academic' ? '"describe the hypothetical chart or graph"' : 'null'},"letterContext":${task === 'Task 1 General' ? '"additional letter context"' : 'null'},"essayType":${task === 'Task 2' ? '"opinion or discussion or problem-solution or advantages-disadvantages"' : 'null'},"structureGuide":${JSON.stringify(structures[task])},"keyVocab":["word1","word2","word3","word4","word5"],"tipForLevel":"one specific tip for ${level} candidate"}`
      }]
    })

    let raw = msg.content[0].text.trim()
    raw = raw.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim()
    const json = JSON.parse(raw)
    return Response.json(json)

  } catch (err) {
    console.error('Topic API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}