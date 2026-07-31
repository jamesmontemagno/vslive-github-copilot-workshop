using DataEntities;
using Microsoft.EntityFrameworkCore;
using Products.Data;

namespace Products.Endpoints;

public static class ProductEndpoints
{
    /// <summary>
    /// Maps product API endpoints for creating, reading, updating, and deleting products.
    /// </summary>
    /// <remarks>Registers a route group at <c>/api/Product</c> with handlers for listing all products,
    /// getting a product by ID, creating a product, updating a product by ID, and deleting a product by ID.</remarks>
    /// <param name="routes">The endpoint route builder used to register the product endpoints.</param>
    public static void MapProductEndpoints (this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/Product");

        group.MapGet("/", async (ProductDataContext db) =>
        {
            return await db.Product.ToListAsync();
        })
        .WithName("GetAllProducts")
        .Produces<List<Product>>(StatusCodes.Status200OK);

        group.MapGet("/{productId}", async (int productId, ProductDataContext db) =>
        {
            return await db.Product.FindAsync(productId)
                is Product model
                    ? Results.Ok(model)
                    : Results.NotFound();
        });

        group.MapPost("/", async (Product product, ProductDataContext db) =>
        {
            db.Product.Add(product);
            await db.SaveChangesAsync();
            return Results.Created($"/api/Product/{product.Id}", product);
        });

		group.MapPut("/{productId}", async (int productId, Product product, ProductDataContext db) =>
		{
			var foundModel = await db.Product.FindAsync(productId);
			if (foundModel is null)
			{
				return Results.NotFound();
			}

            foundModel.Name = product.Name;
            foundModel.Description = product.Description;
            foundModel.Price = product.Price;
            foundModel.ImageUrl = product.ImageUrl;

			await db.SaveChangesAsync();
			return Results.NoContent();
		});

        group.MapDelete("/{id}", async (int id, ProductDataContext db) =>
        {
            var foundModel = await db.Product.FindAsync(id);
            if (foundModel is null)
            {
                return Results.NotFound();
            }

            db.Product.Remove(foundModel);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });




	}
}
