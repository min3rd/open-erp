/**
 * Migration: Add slug and thumbnail fields to products collection
 * Date: 2026-02-04
 * Purpose: Add slug for SEO-friendly URLs and thumbnail for product images with MinIO integration
 */

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    
    try {
      await session.withTransaction(async () => {
        const productsCollection = db.collection('products');
        
        console.log('Starting migration: Add slug and thumbnail to products...');
        
        // Step 1: Add slug and thumbnail fields (nullable) to all existing products
        console.log('Step 1: Adding slug and thumbnail fields to existing products...');
        
        const updateResult = await productsCollection.updateMany(
          {},
          {
            $set: {
              slug: null,
              thumbnail: null,
            },
          },
          { session }
        );
        
        console.log(`Updated ${updateResult.modifiedCount} products with new fields`);
        
        // Step 2: Create indexes for slug field
        console.log('Step 2: Creating indexes for slug field...');
        
        // Unique index for slug within organization scope (sparse to handle null values)
        await productsCollection.createIndex(
          { organizationId: 1, slug: 1 },
          {
            unique: true,
            sparse: true,
            partialFilterExpression: {
              scope: 'organization',
              slug: { $type: 'string' },
            },
            name: 'slug_org_unique',
            session,
          }
        );
        console.log('Created unique index for organization-scoped slugs');
        
        // Unique index for global scope slug (sparse to handle null values)
        await productsCollection.createIndex(
          { slug: 1 },
          {
            unique: true,
            sparse: true,
            partialFilterExpression: {
              scope: 'global',
              slug: { $type: 'string' },
            },
            name: 'slug_global_unique',
            session,
          }
        );
        console.log('Created unique index for global-scoped slugs');
        
        // Step 3: Generate slugs for existing products (optional - can be done lazily)
        console.log('Step 3: Generating slugs for existing products...');
        
        const slugify = (text) => {
          return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-')  // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
        };
        
        // Fetch all products and generate slugs
        const products = await productsCollection.find({}, { session }).toArray();
        
        for (const product of products) {
          if (product.name && !product.slug) {
            let slug = slugify(product.name);
            
            // Check for uniqueness within scope
            let slugExists = true;
            let attempt = 1;
            let uniqueSlug = slug;
            
            while (slugExists && attempt < 100) {
              const filter = { slug: uniqueSlug };
              if (product.scope === 'organization' && product.organizationId) {
                filter.organizationId = product.organizationId;
              }
              
              const existing = await productsCollection.findOne(filter, { session });
              
              if (!existing) {
                slugExists = false;
              } else {
                uniqueSlug = `${slug}-${attempt}`;
                attempt++;
              }
            }
            
            if (!slugExists) {
              await productsCollection.updateOne(
                { _id: product._id },
                { $set: { slug: uniqueSlug } },
                { session }
              );
            }
          }
        }
        
        console.log(`Generated slugs for ${products.length} products`);
        
        console.log('Migration completed successfully!');
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    
    try {
      await session.withTransaction(async () => {
        const productsCollection = db.collection('products');
        
        console.log('Rolling back migration: Remove slug and thumbnail from products...');
        
        // Step 1: Drop indexes
        console.log('Step 1: Dropping slug indexes...');
        
        try {
          await productsCollection.dropIndex('slug_org_unique', { session });
          console.log('Dropped slug_org_unique index');
        } catch (err) {
          console.log('Index slug_org_unique not found or already dropped');
        }
        
        try {
          await productsCollection.dropIndex('slug_global_unique', { session });
          console.log('Dropped slug_global_unique index');
        } catch (err) {
          console.log('Index slug_global_unique not found or already dropped');
        }
        
        // Step 2: Remove slug and thumbnail fields
        console.log('Step 2: Removing slug and thumbnail fields...');
        
        const updateResult = await productsCollection.updateMany(
          {},
          {
            $unset: {
              slug: '',
              thumbnail: '',
            },
          },
          { session }
        );
        
        console.log(`Removed fields from ${updateResult.modifiedCount} products`);
        
        console.log('Rollback completed successfully!');
      });
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  },
};
