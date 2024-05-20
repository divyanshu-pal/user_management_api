const List = require('../model/ListModel');
const transporter = require('../emailConfig');


const replacePlaceholders = (text, user) => {
    let replacedText = text;
    const cityProperty = user.customProperties;
   
    replacedText = replacedText.replace(/\[name\]/g, user.name);
    replacedText = replacedText.replace(/\[email\]/g, user.email);
    replacedText = replacedText.replace(/\[city\]/g, cityProperty.get('city'));

    const unsubscribeLink = `http://localhost:3000/api/unsubscribe?token=${user.unsubscribeToken}`;
   
    replacedText = replacedText.replace(/\[unsubscribe_link\]/g, unsubscribeLink);


    return replacedText;
};

const sendEmailToList = async (req, res) => {
    const listId = req.params.listId;
    const { subject, text } = req.body;
     
    try {
        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        const customPropsMap = new Map();
        list.customProperties.forEach(prop => {
            customPropsMap.set(prop.title, prop.fallbackValue);
        });

        let errors = [];
        let successCount = 0;
        for (const user of list.users) {
            const personalizedText = replacePlaceholders(text, user);
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: subject,
                text: personalizedText,
            };

    try {
        await transporter.sendMail(mailOptions);
        successCount++;
    } catch (error) {
        errors.push({ email: user.email, error: error.message });
    }
}

    res.status(200).json({
        successCount,
        errorCount: errors.length,
        totalCount: list.users.length,
        errors,
    });
} catch (error) {
    res.status(500).json({ error: error.message });
}
};

module.exports = { sendEmailToList };
