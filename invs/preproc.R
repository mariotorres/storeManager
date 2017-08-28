##################################################
## Preproces inventory data
##################################################


## ----------------------------------------
## Libraries
## ----------------------------------------
library(stringr)
library(plyr)
library(dplyr)
library(stringdist)

## ----------------------------------------
## Functions
## ----------------------------------------

## Similarity Supplier
sim_sup <- function(supp, suppliers = c('Cocoon',
                                       'Eli Corame',
                                       'Ema Valdemosa',
                                       'Lessan',
                                       'Libertad',
                                       'Neon Nyx',
                                       'Nicoletta',
                                       'Punto Blanco')){
    strsim <- stringdist(tolower(supp),
                        tolower(suppliers))
    suppliers[which(strsim == min(strsim))[1]]
}

## Similarity Suppliers
n_sim_sup <- function(supp, suppliers = c('Cocoon',
                                         'Eli Corame',
                                         'Ema Valdemosa',
                                         'Lessan',
                                         'Libertad',
                                         'Neon Nyx',
                                         'Nicoletta',
                                         'Punto Blanco')){
    res_sup <- laply(supp, function(t)t <- sim_sup(t, suppliers))
    res_sup <- str_replace_all(res_sup, '\\*', '')
    res_sup
}

## Mod Supp
mod_supp <- function(mod){
    mod <- str_trim(mod)
    data.frame('modelo'   = str_extract(mod, '^[^ ]+ ') %>%
              str_replace_all('\\*', ''),
               'provedor' = str_extract(mod, ' .*'))
}

## ----------------------------------------
## Read in data
## ----------------------------------------
data <- read.csv('celine.csv',
                stringsAsFactors = FALSE)
data <- data[str_length(data$Mod.) > 0,]

## ----------------------------------------
## Process data
## ----------------------------------------
clean_data          <- mod_supp(data$Mod.)
names(clean_data)   <- c('modelo', 'provedor')
clean_data$provedor <- n_sim_sup(clean_data$provedor)
## Fixes
clean_data$provedor[c(53, 54, 61)]  <- 'Punto Blanco'
clean_data$provedor[c(148)]        <- 'Ema Valdemosa'
## Marca
clean_data$marca         <- clean_data$provedor
clean_data$existencias   <- data$Exi
clean_data$costo         <- data$P.X.uni
clean_data$nombre_prenda <- 'Vestido'


## ----------------------------------------
## write data
## ----------------------------------------
write.csv(clean_data,
          'clean_data.csv',
          row.names = FALSE)
