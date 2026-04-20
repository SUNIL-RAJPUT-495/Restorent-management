import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'reserved'],
    default: 'vacant',
  },
  capacity: {
    type: Number,
    default: 4,
  },
}, {
  timestamps: true,
});

const Table = mongoose.model('Table', tableSchema);

export default Table;
