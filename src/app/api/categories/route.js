// pages/api/categories.js
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Category from '@/app/models/Category';

// Mongoose model for Category

// GET request to fetch categories for a specific user
export async function GET(request) {
  try {
    // Connect to the database
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch categories for the specific user
    const categories = await Category.find({ userId });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST request to create a new category for a user
export async function POST(request) {
  try {
    // Connect to the database
    await dbConnect();

    const body = await request.json();
    const { name, type, userId } = body;

    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a new category in the database
    const category = await Category.create({
      name,
      type,
      userId,
    });

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
