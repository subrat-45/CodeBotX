import * as ai from "../Services/aiService.js";

export const getresult = async (req, res) => {
    try {
        const { prompt } = req.query;
        const result = await ai.generateResult(prompt)
        res.send(result)
    } catch (error) {
        res.status(500).send({message : error.message})
    }
};
