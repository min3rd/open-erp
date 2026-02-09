#!/usr/bin/env ts-node
/**
 * Migration script to backfill slugs for existing products
 * 
 * This script:
 * 1. Finds all products without slugs
 * 2. Generates unique slugs based on product names
 * 3. Updates products with the generated slugs
 * 
 * Usage:
 *   npm run migration:backfill-slugs
 * 
 * Or directly:
 *   ts-node scripts/backfill-product-slugs.ts
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../apps/inventory/src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '@shared/schemas';
import { generateSlug, generateUniqueSlug } from '../apps/inventory/src/utils/slug.util';

async function bootstrap() {
  const logger = new Logger('BackfillProductSlugs');
  
  logger.log('Starting slug backfill migration...');
  
  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get Product model
    const productModel: Model<Product> = app.get(getModelToken(Product.name));
    
    // Find all products without slugs
    const productsWithoutSlugs = await productModel.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).exec();
    
    logger.log(`Found ${productsWithoutSlugs.length} products without slugs`);
    
    if (productsWithoutSlugs.length === 0) {
      logger.log('No products need slug backfill. Exiting.');
      await app.close();
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each product
    for (const product of productsWithoutSlugs) {
      try {
        // Generate base slug from product name
        const baseSlug = generateSlug(product.name);
        
        // Check if slug exists for this organization/scope
        const checkSlugExists = async (slug: string): Promise<boolean> => {
          const query: any = { slug, _id: { $ne: product._id } };
          if (product.organizationId) {
            query.organizationId = product.organizationId;
          }
          const existing = await productModel.findOne(query).exec();
          return !!existing;
        };
        
        // Generate unique slug
        const uniqueSlug = await generateUniqueSlug(baseSlug, checkSlugExists);
        
        // Update product with slug
        await productModel.updateOne(
          { _id: product._id },
          { $set: { slug: uniqueSlug } }
        ).exec();
        
        successCount++;
        logger.log(`✓ Updated product ${product.sku} (${product.name}) with slug: ${uniqueSlug}`);
      } catch (error) {
        errorCount++;
        logger.error(`✗ Failed to update product ${product.sku} (${product.name}):`, error.message);
      }
    }
    
    logger.log('\n=== Migration Summary ===');
    logger.log(`Total products processed: ${productsWithoutSlugs.length}`);
    logger.log(`Successfully updated: ${successCount}`);
    logger.log(`Failed: ${errorCount}`);
    logger.log('=========================\n');
    
    if (errorCount > 0) {
      logger.warn('Some products failed to update. Please review the errors above.');
    } else {
      logger.log('✓ All products successfully updated with slugs!');
    }
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the migration
bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
