import Table from '../models/Table.js';

export const getTables = async (req, res) => {
  try {
    const tables = await Table.find({});
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTableStatus = async (req, res) => {
  try {
    const table = await Table.findOne({ number: req.params.number });
    if (table) {
      table.status = req.body.status || table.status;
      const updatedTable = await table.save();
      res.json(updatedTable);
    } else {
      res.status(404).json({ message: 'Table not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addTable = async (req, res) => {
  try {
    const table = new Table(req.body);
    const createdTable = await table.save();
    res.status(201).json(createdTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
