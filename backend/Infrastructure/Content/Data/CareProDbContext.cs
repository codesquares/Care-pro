using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Content.Data
{
    public class CareProDbContext : DbContext
    {
        public CareProDbContext(DbContextOptions<CareProDbContext> options) : base(options)
        {

        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
            base.OnConfiguring(optionsBuilder);
        }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
            modelBuilder.Entity<Caregiver>().ToCollection("CareGivers");
            modelBuilder.Entity<AppUser>().ToCollection("AppUsers");
            modelBuilder.Entity<Client>().ToCollection("Clients");
            
        }

        
        public DbSet<Caregiver> CareGivers { get; set; }
        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<Client> Clients { get; set; }
    }
}
