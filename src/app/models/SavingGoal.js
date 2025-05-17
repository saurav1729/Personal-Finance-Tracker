const mongoose = require('mongoose');

const savingGoalSchema = mongoose.Schema({
    name: {
        type: String, 
        required: true, 
    }, 
    targetAmount: {
        type: Number, 
        required: true, 
    }, 
    currentAmount: {
        type: Number, 
        required: true, 
    }, 
    deadline: {
        type: Date,
        required: false,
    },
    userId: {
        type: String,
        required: true,
    },
    disabled:{
        type:Boolean, 
        required:true
    }, 
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

savingGoalSchema.index({ userId: 1 }); // Index for faster queries by userId

module.exports = mongoose.models.SavingGoal || mongoose.model('SavingGoal', savingGoalSchema);
